import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DEFAULT_FORMATION, FORMATION_LIMITS, FORMATIONS, Formation } from "@/constants/formations";
import { POSITION_GROUPS, POSITION_LABELS } from "@/constants/positions";
import { Athlete, fetchAthletes, fetchMarketAthletes, getOpenRound, getSessionUserId, getTeamForUser } from "@/lib/data";
import { showError, showSuccess } from "@/lib/feedback";
import { supabase } from "@/lib/supabase";

export default function LineupScreen() {
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formation, setFormation] = useState<Formation>(DEFAULT_FORMATION);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [budget, setBudget] = useState<number>(200);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [roundId, setRoundId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const userId = await getSessionUserId();
        if (!userId) {
          if (mounted) setLoading(false);
          showError("Sessao invalida", "Faca login novamente.");
          return;
        }
        const [team, round] = await Promise.all([getTeamForUser(userId), getOpenRound()]);
        if (!mounted) return;

        if (team?.id) setTeamId(team.id);
        if (team?.balance != null) setBudget(team.balance);
        if (round?.id) setRoundId(round.id);

        const list = round ? await fetchMarketAthletes(round.id) : await fetchAthletes();
        if (!mounted) return;
        setAthletes(list.filter((a) => a.position_id !== 6));
      } catch (error) {
        showError("Erro ao carregar escalacao", error, "Tente novamente.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const selected = useMemo(() => {
    const map = new Map(athletes.map((a) => [a.id, a]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as Athlete[];
  }, [athletes, selectedIds]);

  const totalCost = useMemo(() => {
    return selected.reduce((sum, a) => sum + (a.price ?? 0), 0);
  }, [selected]);

  const remaining = budget - totalCost;

  const counts = useMemo(() => {
    const groupCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const player of selected) {
      const pos = player.position_id ?? 0;
      if (POSITION_GROUPS.GK.includes(pos)) groupCounts.GK += 1;
      else if (POSITION_GROUPS.DEF.includes(pos)) groupCounts.DEF += 1;
      else if (POSITION_GROUPS.MID.includes(pos)) groupCounts.MID += 1;
      else if (POSITION_GROUPS.FWD.includes(pos)) groupCounts.FWD += 1;
    }
    return groupCounts;
  }, [selected]);

  const limits = FORMATION_LIMITS[formation];

  const canAdd = (athlete: Athlete) => {
    if (selectedIds.includes(athlete.id)) return true;
    if (selectedIds.length >= 11) return false;
    if ((athlete.price ?? 0) > remaining) return false;

    const pos = athlete.position_id ?? 0;
    if (POSITION_GROUPS.GK.includes(pos)) return counts.GK < 1;
    if (POSITION_GROUPS.DEF.includes(pos)) return counts.DEF < limits.DEF;
    if (POSITION_GROUPS.MID.includes(pos)) return counts.MID < limits.MID;
    if (POSITION_GROUPS.FWD.includes(pos)) return counts.FWD < limits.FWD;
    return false;
  };

  const togglePlayer = (athlete: Athlete) => {
    if (selectedIds.includes(athlete.id)) {
      setSelectedIds((prev) => prev.filter((id) => id !== athlete.id));
      if (captainId === athlete.id) setCaptainId(null);
      return;
    }
    if (!canAdd(athlete)) return;
    setSelectedIds((prev) => [...prev, athlete.id]);
  };

  const onSave = async () => {
    if (!teamId || !roundId) {
      showError("Dados invalidos", "Rodada ou time invalido.");
      return;
    }
    if (selectedIds.length !== 11 || counts.GK !== 1 || counts.DEF !== limits.DEF || counts.MID !== limits.MID || counts.FWD !== limits.FWD) {
      showError("Escalacao incompleta", "Preencha a formacao selecionada.");
      return;
    }
    const captain = captainId ?? selectedIds[0];

    try {
      const { data: lineup, error: lineupError } = await supabase
        .from("lineups")
        .upsert({
          team_id: teamId,
          round_id: roundId,
          captain_athlete_id: captain,
          formation,
        }, { onConflict: "team_id,round_id" })
        .select("id")
        .single();

      if (lineupError || !lineup) {
        showError("Erro ao salvar escalacao", lineupError, "Erro desconhecido.");
        return;
      }

      const { error: deleteError } = await supabase.from("lineup_players").delete().eq("lineup_id", lineup.id);
      if (deleteError) {
        showError("Erro ao atualizar atletas", deleteError);
        return;
      }

      const inserts = selectedIds.map((id) => ({ lineup_id: lineup.id, athlete_id: id, is_starter: true }));
      const { error: playersError } = await supabase.from("lineup_players").insert(inserts);

      if (playersError) {
        showError("Erro ao salvar atletas", playersError);
        return;
      }

      showSuccess("Escalacao salva", "Seu time foi salvo com sucesso.");
    } catch (error) {
      showError("Erro ao salvar escalacao", error, "Tente novamente.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escalação</Text>
      <Text style={styles.subtitle}>Monte seu time e escolha o capitão.</Text>

      <View style={styles.statsRow}>
        <Text>Saldo: C$ {remaining.toFixed(2)}</Text>
        <Text>Jogadores: {selectedIds.length}/11</Text>
      </View>

      <View style={styles.formations}>
        {FORMATIONS.map((f) => (
          <Pressable
            key={f}
            style={[styles.formationButton, f === formation && styles.formationButtonActive]}
            onPress={() => setFormation(f)}
          >
            <Text style={[styles.formationText, f === formation && styles.formationTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.counts}>
        <Text>GOL: {counts.GK}/1</Text>
        <Text>DEF: {counts.DEF}/{limits.DEF}</Text>
        <Text>MEI: {counts.MID}/{limits.MID}</Text>
        <Text>ATA: {counts.FWD}/{limits.FWD}</Text>
      </View>

      <Text style={styles.section}>Atletas</Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={athletes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const selected = selectedIds.includes(item.id);
            const disabled = !selected && !canAdd(item);
            return (
              <Pressable
                style={[styles.row, selected && styles.rowSelected, disabled && styles.rowDisabled]}
                onPress={() => togglePlayer(item)}
              >
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.nickname || item.name}</Text>
                  <Text style={styles.rowMeta}>{POSITION_LABELS[item.position_id ?? 0] ?? "—"}</Text>
                </View>
                <Text style={styles.rowPrice}>
                  {item.price != null ? `C$ ${item.price.toFixed(2)}` : "—"}
                </Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Sem atletas disponíveis.</Text>}
        />
      )}

      <Text style={styles.section}>Capitão</Text>
      <View style={styles.captains}>
        {selected.map((player) => (
          <Pressable
            key={player.id}
            style={[styles.captainButton, captainId === player.id && styles.captainButtonActive]}
            onPress={() => setCaptainId(player.id)}
          >
            <Text style={captainId === player.id ? styles.captainTextActive : styles.captainText}>
              {player.nickname || player.name}
            </Text>
          </Pressable>
        ))}
        {selected.length === 0 && <Text style={styles.empty}>Selecione atletas para escolher capitão.</Text>}
      </View>

      <Pressable style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveButtonText}>Salvar escalação</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
  subtitle: {
    color: "#666",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  formations: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  formationButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  formationButtonActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  formationText: {
    color: "#333",
  },
  formationTextActive: {
    color: "#fff",
  },
  counts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  section: {
    marginTop: 8,
    fontWeight: "600",
  },
  list: {
    paddingVertical: 8,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  rowSelected: {
    borderColor: "#111",
    backgroundColor: "#f5f5f5",
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowInfo: {
    gap: 2,
  },
  rowName: {
    fontWeight: "600",
  },
  rowMeta: {
    color: "#777",
    fontSize: 12,
  },
  rowPrice: {
    fontWeight: "600",
  },
  captains: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  captainButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  captainButtonActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  captainText: {
    color: "#333",
  },
  captainTextActive: {
    color: "#fff",
  },
  saveButton: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  empty: {
    color: "#777",
    textAlign: "center",
  },
});
