import { useState } from 'react';  
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';  
import { Link } from 'expo-router';  
import { showError } from '@/lib/feedback';
import { supabase } from '@/lib/supabase';  
  
const isValidEmail = (value: string) => value.includes('@') && value.includes('.');  
const normalizeLoginError = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes('email not confirmed')) {
    return 'Email ainda nao confirmado. Verifique sua caixa de entrada e spam.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Email ou senha invalidos.';
  }
  return message;
};
  
export default function LoginScreen() {  
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');  
  const [loading, setLoading] = useState(false);  
  const [errorText, setErrorText] = useState('');  
  
  const onLogin = async () => {  
    setErrorText('');  
    if (!email || !password) {
      const message = 'Preencha email e senha.';
      setErrorText(message);
      showError('Dados invalidos', message);
      return;
    }
    if (!isValidEmail(email.trim())) {
      const message = 'Email invalido.';
      setErrorText(message);
      showError('Dados invalidos', message);
      return;
    }
    try {
      setLoading(true);  
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });  
      if (error) {
        const normalized = normalizeLoginError(error.message);
        setErrorText(normalized);
        showError('Falha no login', normalized);
      }
    } catch (error) {
      const message = 'Nao foi possivel entrar.';
      setErrorText(message);
      showError('Falha no login', error, message);
    } finally {
      setLoading(false);  
    }
  };  
  
  return (  
    <View style={styles.screen}>  
      <View style={styles.card}>  
        <Text style={styles.brand}>CARTOLA</Text>  
        <Text style={styles.title}>Entrar</Text>  
        <Text style={styles.subtitle}>Acesse sua conta para montar seu time.</Text>  
        <TextInput style={styles.input} placeholder='Email' placeholderTextColor='#8d8d8d' autoCapitalize='none' keyboardType='email-address' value={email} onChangeText={setEmail} />  
        <TextInput style={styles.input} placeholder='Senha' placeholderTextColor='#8d8d8d' secureTextEntry value={password} onChangeText={setPassword} />  
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onLogin} disabled={loading}>  
          {loading ? <ActivityIndicator color='#fff' /> : <Text style={styles.buttonText}>Entrar</Text>}  
        </Pressable>  
        {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}  
        <Text style={styles.footer}>Nao tem conta? <Link href='/register' style={styles.link}>Criar agora</Link></Text>  
      </View>  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({  
  screen: { flex: 1, backgroundColor: '#0b0b0b', justifyContent: 'center', padding: 20 },  
  card: { backgroundColor: '#141414', borderColor: '#2d2d2d', borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },  
  brand: { color: '#f5f5f5', fontSize: 12, fontWeight: '700', letterSpacing: 2 },  
  title: { color: '#ffffff', fontSize: 30, fontWeight: '700' },  
  subtitle: { color: '#b0b0b0', marginBottom: 8 },  
  input: { backgroundColor: '#0c0c0c', borderColor: '#3d3d3d', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, color: '#fff' },  
  button: { marginTop: 10, backgroundColor: '#b91c1c', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },  
  buttonDisabled: { opacity: 0.65 },  
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },  
  errorText: { color: '#f87171', fontSize: 13 },  
  footer: { color: '#d0d0d0', textAlign: 'center', marginTop: 6 },  
  link: { color: '#ef4444', fontWeight: '700' },  
}); 
