import { useEffect, useState } from 'react';  
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';  
import { getSessionUserId, getTeamForUser } from '@/lib/data';  
import { showError, showSuccess } from '@/lib/feedback';
import { supabase } from '@/lib/supabase';  
  
type League = { id: string; name: string; is_public: boolean; invite_code: string | null };  
  
export default function LeaguesScreen() {  
  const [loading, setLoading] = useState(true);  
  const [leagues, setLeagues] = useState<League[]>([]);  
  const [name, setName] = useState('');  
  const [inviteCode, setInviteCode] = useState('');  
  const [isPublic, setIsPublic] = useState(false);  
  
  const load = async () => {  
    try {
      setLoading(true);  
      const { data, error } = await supabase.from('leagues').select('id,name,is_public,invite_code').order('created_at', { ascending: false });  
      if (error) {
        showError('Erro ao carregar ligas', error);
        return;
      }
      setLeagues(data ?? []);  
    } catch (error) {
      showError('Erro ao carregar ligas', error, 'Tente novamente.');
    } finally {
      setLoading(false);  
    }
  };  
  
  useEffect(() => { load(); }, []);  
  
  const createLeague = async () => {  
    try {
      const userId = await getSessionUserId();  
      if (!userId) {
        showError('Sessao invalida', 'Faca login novamente.');
        return;
      }
      if (!name.trim()) {
        showError('Dados invalidos', 'Informe o nome da liga.');
        return;
      }

      const code = Math.random().toString(36).slice(2, 8).toUpperCase();  
      const { error } = await supabase.from('leagues').insert({ name: name.trim(), owner_id: userId, is_public: isPublic, invite_code: code });  
      if (error) {
        showError('Erro ao criar liga', error);
        return;
      }

      setName('');  
      setIsPublic(false);  
      showSuccess('Liga criada', `Codigo de convite: ${code}`);
      load();  
    } catch (error) {
      showError('Erro ao criar liga', error, 'Tente novamente.');
    }
  };  
  
  const joinLeague = async () => {  
    try {
      const userId = await getSessionUserId();  
      if (!userId) {
        showError('Sessao invalida', 'Faca login novamente.');
        return;
      }
      if (!inviteCode.trim()) {
        showError('Dados invalidos', 'Informe o codigo de convite.');
        return;
      }

      const team = await getTeamForUser(userId);  
      if (!team?.id) {
        showError('Time obrigatorio', 'Crie seu time antes de entrar em uma liga.');
        return;
      }

      const normalizedCode = inviteCode.trim().toUpperCase();
      const { data: league, error: leagueError } = await supabase.from('leagues').select('id').eq('invite_code', normalizedCode).maybeSingle();  
      if (leagueError) {
        showError('Erro ao buscar liga', leagueError);
        return;
      }
      if (!league?.id) {
        showError('Liga nao encontrada', 'Verifique o codigo e tente novamente.');
        return;
      }

      const { error } = await supabase.from('league_members').insert({ league_id: league.id, team_id: team.id });  
      if (error) {
        showError('Erro ao entrar na liga', error);
        return;
      }

      setInviteCode('');  
      showSuccess('Entrada confirmada', 'Voce entrou na liga com sucesso.');
      load();  
    } catch (error) {
      showError('Erro ao entrar na liga', error, 'Tente novamente.');
    }
  };  
  
  return (  
    <View style={styles.screen}>  
      <Text style={styles.title}>Ligas</Text>  
      <Text style={styles.subtitle}>Crie ligas privadas ou publicas e jogue com amigos.</Text>  
      <TextInput style={styles.input} placeholder='Nome da liga' placeholderTextColor='#8d8d8d' value={name} onChangeText={setName} />  
      <View style={styles.row}>  
        <Pressable style={[styles.chip, isPublic && styles.chipActive]} onPress={() => setIsPublic(!isPublic)}><Text style={styles.chipText}>{isPublic ? 'Publica' : 'Privada'}</Text></Pressable>  
        <Pressable style={styles.button} onPress={createLeague}><Text style={styles.buttonText}>Criar liga</Text></Pressable>  
      </View>  
      <View style={styles.row}>  
        <TextInput style={[styles.input, styles.flex]} placeholder='Codigo de convite' placeholderTextColor='#8d8d8d' value={inviteCode} onChangeText={setInviteCode} />  
        <Pressable style={styles.button} onPress={joinLeague}><Text style={styles.buttonText}>Entrar</Text></Pressable>  
      </View>  
      {loading ? <ActivityIndicator color='#ef4444' /> : <FlatList data={leagues} keyExtractor={(i) => i.id} contentContainerStyle={styles.list} renderItem={({ item }) => <View style={styles.item}><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>{item.is_public ? 'Publica' : 'Privada'} | Codigo: {item.invite_code ?? '-'}</Text></View>} />}  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({  
  screen: { flex: 1, backgroundColor: '#0b0b0b', padding: 20, gap: 10 },  
  title: { color: '#fff', fontSize: 28, fontWeight: '700' },  
  subtitle: { color: '#b3b3b3', marginBottom: 4 },  
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },  
  flex: { flex: 1 },  
  input: { backgroundColor: '#101010', borderColor: '#3a3a3a', borderWidth: 1, borderRadius: 12, color: '#fff', paddingHorizontal: 14, paddingVertical: 12 },  
  button: { backgroundColor: '#b91c1c', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },  
  buttonText: { color: '#fff', fontWeight: '700' },  
  chip: { borderColor: '#3a3a3a', borderWidth: 1, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12, backgroundColor: '#141414' },  
  chipActive: { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },  
  chipText: { color: '#fff', fontWeight: '600' },  
  list: { paddingVertical: 8, gap: 10 },  
  item: { backgroundColor: '#141414', borderColor: '#2d2d2d', borderWidth: 1, borderRadius: 12, padding: 14 },  
  name: { color: '#fff', fontWeight: '700' },  
  meta: { color: '#b3b3b3', fontSize: 12 },  
}); 
