import { useState } from 'react';  
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';  
import { router } from 'expo-router';  
import { showError, showSuccess } from '@/lib/feedback';
import { supabase } from '@/lib/supabase';  
  
export default function SetupScreen() {  
  const [username, setUsername] = useState('');  
  const [teamName, setTeamName] = useState('');  
  const [loading, setLoading] = useState(false);  
  
  const onSave = async () => {  
    if (!username || !teamName) {
      showError('Dados invalidos', 'Preencha todos os campos.');
      return;
    }
    try {
      setLoading(true);  
      const { data: { user }, error: userError } = await supabase.auth.getUser();  
      if (userError || !user) {  
        showError('Sessao invalida', userError, 'Faca login novamente.');  
        router.replace('/login');  
        return;  
      }  
      const profileRes = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email ?? null,
        username: username.trim(),
        full_name: user.user_metadata?.full_name ?? null,
      });  
      if (profileRes.error) {  
        showError('Erro ao salvar perfil', profileRes.error);
        return;
      }  
      const teamRes = await supabase.from('teams').upsert({ owner_id: user.id, name: teamName.trim() }, { onConflict: 'owner_id' });  
      if (teamRes.error) {
        showError('Erro ao criar time', teamRes.error);
        return;
      }

      showSuccess('Cadastro finalizado', 'Perfil e time criados com sucesso.');
      router.replace('/');  
    } catch (error) {
      showError('Erro ao finalizar cadastro', error, 'Tente novamente.');
    } finally {
      setLoading(false);  
    }
  };  
  
  return (  
    <View style={styles.screen}>  
      <View style={styles.card}>  
        <Text style={styles.brand}>CARTOLA</Text>  
        <Text style={styles.title}>Finalize seu cadastro</Text>  
        <Text style={styles.subtitle}>Defina seu usuario e nome do time.</Text>  
        <TextInput style={styles.input} placeholder='Nome de usuario' placeholderTextColor='#8d8d8d' value={username} onChangeText={setUsername} />  
        <TextInput style={styles.input} placeholder='Nome do time' placeholderTextColor='#8d8d8d' value={teamName} onChangeText={setTeamName} />  
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onSave} disabled={loading}>  
          {loading ? <ActivityIndicator color='#fff' /> : <Text style={styles.buttonText}>Salvar</Text>}  
        </Pressable>  
      </View>  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({  
  screen: { flex: 1, backgroundColor: '#0b0b0b', justifyContent: 'center', padding: 20 },  
  card: { backgroundColor: '#141414', borderColor: '#2d2d2d', borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },  
  brand: { color: '#f5f5f5', fontSize: 12, fontWeight: '700', letterSpacing: 2 },  
  title: { color: '#ffffff', fontSize: 28, fontWeight: '700' },  
  subtitle: { color: '#b0b0b0', marginBottom: 8 },  
  input: { backgroundColor: '#0c0c0c', borderColor: '#3d3d3d', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, color: '#fff' },  
  button: { marginTop: 10, backgroundColor: '#b91c1c', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },  
  buttonDisabled: { opacity: 0.65 },  
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },  
}); 
