import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cartola</Text>
      <Text style={styles.subtitle}>Seu time, sua liga, sua disputa.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rodada Atual</Text>
        <Text style={styles.cardValue}>—</Text>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.cardSmall}>
          <Text style={styles.cardTitle}>Saldo</Text>
          <Text style={styles.cardValue}>—</Text>
        </View>
        <View style={styles.cardSmall}>
          <Text style={styles.cardTitle}>Pontos</Text>
          <Text style={styles.cardValue}>—</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
  },
  cardSmall: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  },
  cardTitle: {
    fontSize: 14,
    color: "#777",
  },
  cardValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "600",
  },
});
