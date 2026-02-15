import { StyleSheet, Text, View } from 'react-native';  
  
export default function HomeScreen() {  
  return (  
    <View style={styles.screen}>  
      <Text style={styles.title}>Cartola MVP</Text>  
      <Text style={styles.subtitle}>Visao geral rapida da rodada.</Text>  
      <View style={styles.card}><Text style={styles.cardLabel}>Rodada atual</Text><Text style={styles.cardValue}>1</Text></View>  
      <View style={styles.row}>  
        <View style={styles.cardSmall}><Text style={styles.cardLabel}>Saldo</Text><Text style={styles.cardValue}>C$ 200.00</Text></View>  
        <View style={styles.cardSmall}><Text style={styles.cardLabel}>Pontos</Text><Text style={styles.cardValue}>0.00</Text></View>  
      </View>  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({  
  screen: { flex: 1, backgroundColor: '#0b0b0b', padding: 20, gap: 12 },  
  title: { color: '#fff', fontSize: 28, fontWeight: '700' },  
  subtitle: { color: '#b3b3b3', marginBottom: 4 },  
  card: { backgroundColor: '#141414', borderColor: '#2d2d2d', borderWidth: 1, borderRadius: 14, padding: 16 },  
  row: { flexDirection: 'row', gap: 10 },  
  cardSmall: { flex: 1, backgroundColor: '#141414', borderColor: '#2d2d2d', borderWidth: 1, borderRadius: 14, padding: 16 },  
  cardLabel: { color: '#a3a3a3', fontSize: 13 },  
  cardValue: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 4 },  
}); 
