import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { getSessionUserId, getTeamForUser } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [teamName, setTeamName] = useState("");
  const [balance, setBalance] = useState<number>(200);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const userId = await getSessionUserId();
      if (!userId) {
        if (mounted) setLoading(false);
        return;
      }
      const [{ data: profile }, team] = await Promise.all([
        supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
        getTeamForUser(userId),
      ]);
      if (!mounted) return;
      setUsername(profile?.username ?? "");
      setTeamName(team?.name ?? "");
      setBalance(team?.balance ?? 200);
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async () => {
    const userId = await getSessionUserId();
    if (!userId) return;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", userId);

    if (profileError) {
      Alert.alert("Erro ao salvar perfil", profileError.message);
      return;
    }

    const { error: teamError } = await supabase
      .from("teams")
      .update({ name: teamName.trim() })
      .eq("owner_id", userId);

    if (teamError) {
      Alert.alert("Erro ao salvar time", teamError.message);
      return;
    }

    Alert.alert("Dados atualizados");
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Configurações e dados da conta.</Text>

      <Text style={styles.label}>Usuário</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} />

      <Text style={styles.label}>Time</Text>
      <TextInput style={styles.input} value={teamName} onChangeText={setTeamName} />

      <Text style={styles.label}>Saldo</Text>
      <Text style={styles.value}>C$ {balance.toFixed(2)}</Text>

      <Pressable style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>Salvar</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={onLogout}>
        <Text style={styles.buttonText}>Sair</Text>
      </Pressable>
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
    fontSize: 24,
    fontWeight: "600",
  },
  subtitle: {
    color: "#666",
  },
  label: {
    fontSize: 12,
    color: "#666",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
  },
  button: {
    marginTop: 12,
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
