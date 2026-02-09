import { StyleSheet, Text, View } from "react-native";

export default function LeaguesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ligas</Text>
      <Text style={styles.subtitle}>Crie ou participe de ligas com amigos.</Text>
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
