import { useEffect, useState } from 'react';  
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';  
import { getSessionUserId, getTeamForUser } from '@/lib/data';  
import { showError, showSuccess } from '@/lib/feedback';
import { supabase } from '@/lib/supabase';  
  
export default function ProfileScreen() {  
  const [loading, setLoading] = useState(true);  
  const [username, setUsername] = useState('');  
  const [teamName, setTeamName] = useState('');  
  const [balance, setBalance] = useState(200);  
  
  useEffect(() => {  
    let mounted = true;  
    const load = async () => {  
      try {
        const userId = await getSessionUserId();  
        if (!userId) {
          if (mounted) setLoading(false);
          showError('Sessao invalida', 'Faca login novamente.');
          return;
        }
        const [{ data: profile, error: profileError }, team] = await Promise.all([supabase.from('profiles').select('username').eq('id', userId).maybeSingle(), getTeamForUser(userId)]);  
        if (!mounted) return;  
        if (profileError) {
          showError('Erro ao carregar perfil', profileError);
          return;
        }
        setUsername(profile?.username ?? '');  
        setTeamName(team?.name ?? '');  
        setBalance(team?.balance ?? 200);  
      } catch (error) {
        showError('Erro ao carregar perfil', error, 'Tente novamente.');
      } finally {
        if (mounted) setLoading(false);  
      }
    };  
    load();  
    return () => { mounted = false; };  
  }, []);  
  
  const onSave = async () => {  
    const trimmedUsername = username.trim();
    const trimmedTeamName = teamName.trim();
    if (!trimmedUsername || !trimmedTeamName) {
      showError('Dados invalidos', 'Usuario e time sao obrigatorios.');
      return;
    }

    try {
      const userId = await getSessionUserId();  
      if (!userId) {
        showError('Sessao invalida', 'Faca login novamente.');
        return;
      }
      const { error: pErr } = await supabase.from('profiles').update({ username: trimmedUsername }).eq('id', userId);  
      if (pErr) {
        showError('Erro ao salvar perfil', pErr);
        return;
      }
      const { error: tErr } = await supabase.from('teams').update({ name: trimmedTeamName }).eq('owner_id', userId);  
      if (tErr) {
        showError('Erro ao salvar time', tErr);
        return;
      }
      showSuccess('Dados salvos', 'Perfil atualizado com sucesso.');
    } catch (error) {
      showError('Erro ao salvar perfil', error, 'Tente novamente.');
    }
  };  
  
  const onLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        showError('Erro ao sair', error);
      }
    } catch (error) {
      showError('Erro ao sair', error, 'Tente novamente.');
    }
  };  
  
  if (loading) return <View style={styles.screen}><ActivityIndicator color='#ef4444' /></View>;  
  
  return (  
    <View style={styles.screen}>  
      <Text style={styles.title}>Perfil</Text>  
      <Text style={styles.subtitle}>Gerencie seus dados do time.</Text>  
      <Text style={styles.label}>Usuario</Text>  
      <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder='Nome de usuario' placeholderTextColor='#8d8d8d' />  
      <Text style={styles.label}>Time</Text>  
      <TextInput style={styles.input} value={teamName} onChangeText={setTeamName} placeholder='Nome do time' placeholderTextColor='#8d8d8d' />  
      <Text style={styles.label}>Saldo</Text>  
      <Text style={styles.value}>C$ {balance.toFixed(2)}</Text>  
      <Pressable style={styles.button} onPress={onSave}><Text style={styles.buttonText}>Salvar alteracoes</Text></Pressable>  
      <Pressable style={styles.buttonSecondary} onPress={onLogout}><Text style={styles.buttonText}>Sair</Text></Pressable>  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({  
  screen: { flex: 1, backgroundColor: '#0b0b0b', padding: 20, gap: 10 },  
  title: { color: '#fff', fontSize: 28, fontWeight: '700' },  
  subtitle: { color: '#b3b3b3' },  
  label: { color: '#a3a3a3', fontSize: 12 },  
  value: { color: '#fff', fontSize: 18, fontWeight: '700' },  
  input: { backgroundColor: '#101010', borderColor: '#3a3a3a', borderWidth: 1, borderRadius: 12, color: '#fff', paddingHorizontal: 14, paddingVertical: 12 },  
  button: { backgroundColor: '#b91c1c', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 6 },  
  buttonSecondary: { backgroundColor: '#27272a', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },  
  buttonText: { color: '#fff', fontWeight: '700' },  
}); 
