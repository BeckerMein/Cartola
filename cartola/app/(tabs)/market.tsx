import { StyleSheet, Text, View } from "react-native";

export default function MarketScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mercado</Text>
      <Text style={styles.subtitle}>Lista de atletas e preços.</Text>
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
});
