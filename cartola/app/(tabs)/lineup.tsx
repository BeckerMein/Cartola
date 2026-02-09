import { StyleSheet, Text, View } from "react-native";

export default function LineupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escalação</Text>
      <Text style={styles.subtitle}>Monte seu time e escolha o capitão.</Text>
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
