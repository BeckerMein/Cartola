import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { supabase } from "@/lib/supabase";

export default function Index() {
  const [loading, setLoading] = useState(true);

  const routeForSession = async (sessionUserId: string) => {
    const [{ data: profile }, { data: team }] = await Promise.all([
      supabase.from("profiles").select("id").eq("id", sessionUserId).maybeSingle(),
      supabase.from("teams").select("id").eq("owner_id", sessionUserId).maybeSingle(),
    ]);

    if (!profile || !team) {
      router.replace("/(auth)/setup");
      return;
    }

    router.replace("/(tabs)");
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (data.session?.user?.id) {
        await routeForSession(data.session.user.id);
      } else {
        router.replace("/(auth)/login");
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user?.id) {
        routeForSession(session.user.id);
      } else {
        router.replace("/(auth)/login");
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!loading) return null;

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
