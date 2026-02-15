import { useEffect, useMemo, useState } from 'react';  
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';  
import { Athlete, fetchAthletes, fetchMarketAthletes, getOpenRound } from '@/lib/data';  
import { POSITION_LABELS } from '@/constants/positions';  
import { showError } from '@/lib/feedback';
  
export default function MarketScreen() {  
  const [loading, setLoading] = useState(true);  
  const [athletes, setAthletes] = useState<Athlete[]>([]);  
  const [query, setQuery] = useState('');  
  
  useEffect(() => {  
    let mounted = true;  
    const load = async () => {  
      try {
        const round = await getOpenRound();  
        const list = round ? await fetchMarketAthletes(round.id) : await fetchAthletes();  
        if (!mounted) return;  
        setAthletes(list);  
      } catch (error) {
        showError('Erro ao carregar mercado', error, 'Tente novamente.');
      } finally {
        if (mounted) setLoading(false);  
      }
    };  
    load();  
    return () => { mounted = false; };  
  }, []);  
  
  const filtered = useMemo(() => {  
    const q = query.trim().toLowerCase();  
    if (!q) return athletes;  
    return athletes.filter((a) => a.name.toLowerCase().includes(q) || (a.nickname ?? '').toLowerCase().includes(q));  
  }, [athletes, query]);  
  
  return (  
    <View style={styles.screen}>  
      <Text style={styles.title}>Mercado</Text>  
      <Text style={styles.subtitle}>Lista de atletas e precos atualizados.</Text>  
      <TextInput style={styles.search} placeholder='Buscar atleta' placeholderTextColor='#8d8d8d' value={query} onChangeText={setQuery} />  
      {loading ? <ActivityIndicator color='#ef4444' /> : (  
        <FlatList data={filtered} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list}  
          renderItem={({ item }) => <View style={styles.row}><View><Text style={styles.name}>{item.nickname || item.name}</Text><Text style={styles.meta}>{POSITION_LABELS[item.position_id ?? 0] ?? '-'}</Text></View><Text style={styles.price}>{item.price != null ? `C$ ${item.price.toFixed(2)}` : '-'}</Text></View>}  
          ListEmptyComponent={<Text style={styles.empty}>Sem atletas disponiveis.</Text>} />  
      )}  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({  
  screen: { flex: 1, backgroundColor: '#0b0b0b', padding: 20, gap: 10 },  
  title: { color: '#fff', fontSize: 28, fontWeight: '700' },  
  subtitle: { color: '#b3b3b3' },  
  search: { backgroundColor: '#101010', borderColor: '#3a3a3a', borderWidth: 1, borderRadius: 12, color: '#fff', paddingHorizontal: 14, paddingVertical: 12, marginTop: 6 },  
  list: { paddingVertical: 8, gap: 10 },  
  row: { backgroundColor: '#141414', borderColor: '#2d2d2d', borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },  
  name: { color: '#fff', fontWeight: '700' },  
  meta: { color: '#a3a3a3', fontSize: 12 },  
  price: { color: '#ef4444', fontWeight: '700' },  
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 16 },  
}); 
