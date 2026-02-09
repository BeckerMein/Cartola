import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getSessionUserId, getTeamForUser } from "@/lib/data";
import { supabase } from "@/lib/supabase";

type League = {
  id: string;
  name: string;
  is_public: boolean;
  owner_id: string;
  invite_code: string | null;
};

export default function LeaguesScreen() {
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leagues")
      .select("id,name,is_public,owner_id,invite_code")
      .order("created_at", { ascending: false });
    setLeagues(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createLeague = async () => {
    const userId = await getSessionUserId();
    if (!userId || !name.trim()) return;
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("leagues").insert({
      name: name.trim(),
      owner_id: userId,
      is_public: isPublic,
      invite_code: code,
    });
    if (error) {
      Alert.alert("Erro ao criar liga", error.message);
      return;
    }
    setName("");
    setIsPublic(false);
    await load();
  };

  const joinLeague = async () => {
    const userId = await getSessionUserId();
    if (!userId) return;
    const team = await getTeamForUser(userId);
    if (!team?.id) {
      Alert.alert("Crie um time primeiro");
      return;
    }
    const { data: league } = await supabase
      .from("leagues")
      .select("id")
      .eq("invite_code", inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (!league?.id) {
      Alert.alert("Liga não encontrada");
      return;
    }

    const { error } = await supabase.from("league_members").insert({
      league_id: league.id,
      team_id: team.id,
    });
    if (error) {
      Alert.alert("Erro ao entrar na liga", error.message);
      return;
    }

    setInviteCode("");
    await load();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ligas</Text>
      <Text style={styles.subtitle}>Crie ou participe de ligas com amigos.</Text>

      <Text style={styles.section}>Criar liga</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome da liga"
        value={name}
        onChangeText={setName}
      />
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggle, isPublic && styles.toggleActive]}
          onPress={() => setIsPublic((v) => !v)}
        >
          <Text style={isPublic ? styles.toggleTextActive : styles.toggleText}>
            {isPublic ? "Pública" : "Privada"}
          </Text>
        </Pressable>
        <Pressable style={styles.button} onPress={createLeague}>
          <Text style={styles.buttonText}>Criar</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Entrar por código</Text>
      <View style={styles.joinRow}>
        <TextInput
          style={[styles.input, styles.inputGrow]}
          placeholder="Código"
          value={inviteCode}
          onChangeText={setInviteCode}
        />
        <Pressable style={styles.button} onPress={joinLeague}>
          <Text style={styles.buttonText}>Entrar</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Ligas</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={leagues}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.leagueRow}>
              <View>
                <Text style={styles.leagueName}>{item.name}</Text>
                <Text style={styles.leagueMeta}>
                  {item.is_public ? "Pública" : "Privada"} • Código: {item.invite_code ?? "—"}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma liga.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
  subtitle: {
    color: "#666",
  },
  section: {
    marginTop: 10,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
  },
  inputGrow: {
    flex: 1,
  },
  button: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggle: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  toggleActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  toggleText: {
    color: "#333",
  },
  toggleTextActive: {
    color: "#fff",
  },
  joinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  list: {
    paddingVertical: 8,
    gap: 10,
  },
  leagueRow: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  leagueName: {
    fontWeight: "600",
  },
  leagueMeta: {
    color: "#777",
    fontSize: 12,
  },
  empty: {
    color: "#777",
    textAlign: "center",
    marginTop: 12,
  },
});
