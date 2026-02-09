import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from "react-native";

import { Athlete, fetchAthletes, fetchMarketAthletes, getOpenRound } from "@/lib/data";
import { POSITION_LABELS } from "@/constants/positions";

export default function MarketScreen() {
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const round = await getOpenRound();
      const list = round ? await fetchMarketAthletes(round.id) : await fetchAthletes();
      if (!mounted) return;
      setAthletes(list);
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return athletes;
    return athletes.filter((a) => a.name.toLowerCase().includes(q) || (a.nickname ?? "").toLowerCase().includes(q));
  }, [athletes, query]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mercado</Text>
      <Text style={styles.subtitle}>Lista de atletas e preços.</Text>

      <TextInput
        style={styles.search}
        placeholder="Buscar atleta"
        value={query}
        onChangeText={setQuery}
      />

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.nickname || item.name}</Text>
                <Text style={styles.rowMeta}>{POSITION_LABELS[item.position_id ?? 0] ?? "—"}</Text>
              </View>
              <Text style={styles.rowPrice}>
                {item.price != null ? `C$ ${item.price.toFixed(2)}` : "—"}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Sem atletas disponíveis.</Text>}
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
  search: {
    borderWidth: 1,
    borderColor: "#e3e3e3",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
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
  empty: {
    color: "#777",
    textAlign: "center",
    marginTop: 20,
  },
});
