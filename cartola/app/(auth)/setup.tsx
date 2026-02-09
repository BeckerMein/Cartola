import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { supabase } from "@/lib/supabase";

export default function SetupScreen() {
  const [username, setUsername] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!username || !teamName) {
      Alert.alert("Preencha todos os campos");
      return;
    }

    setLoading(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      Alert.alert("Erro", "Sessão inválida. Faça login novamente.");
      router.replace("/(auth)/login");
      return;
    }

    const profileRes = await supabase.from("profiles").upsert({
      id: user.id,
      username: username.trim(),
      full_name: user.user_metadata?.full_name ?? null,
    });

    if (profileRes.error) {
      setLoading(false);
      Alert.alert("Erro ao salvar perfil", profileRes.error.message);
      return;
    }

    const teamRes = await supabase.from("teams").insert({
      owner_id: user.id,
      name: teamName.trim(),
    });

    if (teamRes.error) {
      setLoading(false);
      Alert.alert("Erro ao criar time", teamRes.error.message);
      return;
    }

    setLoading(false);
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finalize seu cadastro</Text>
      <Text style={styles.subtitle}>Escolha seu nome de usuário e o nome do time.</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome de usuário"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Nome do time"
        value={teamName}
        onChangeText={setTeamName}
      />

      <Pressable style={styles.button} onPress={onSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
  },
  button: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
