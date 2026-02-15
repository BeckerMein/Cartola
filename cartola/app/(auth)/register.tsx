import { useState } from 'react';  
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';  
import { Link, router } from 'expo-router';  
import { showError, showSuccess } from '@/lib/feedback';
import { supabase } from '@/lib/supabase';  
  
const isValidEmail = (value: string) => value.includes('@') && value.includes('.');  
  
export default function RegisterScreen() {  
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');  
  const [username, setUsername] = useState('');  
  const [teamName, setTeamName] = useState('');  
  const [loading, setLoading] = useState(false);  
  const [errorText, setErrorText] = useState('');  
  
  const onRegister = async () => {  
    setErrorText('');  
    if (!email || !password || !username || !teamName) {
      const message = 'Preencha todos os campos.';
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
    if (password.length < 6) {
      const message = 'A senha precisa ter pelo menos 6 caracteres.';
      setErrorText(message);
      showError('Dados invalidos', message);
      return;
    }
    try {
      setLoading(true);  
      const { data, error } = await supabase.auth.signUp({  
        email: email.trim(), password,  
        options: { data: { username: username.trim(), full_name: username.trim(), team_name: teamName.trim() } },  
      });  
      if (error) {
        setErrorText(error.message);
        showError('Erro no cadastro', error, 'Nao foi possivel criar a conta.');
        return;
      }

      setErrorText('');
      if (data.user && !data.session) {
        showSuccess(
          'Conta criada',
          'Confirme o email antes de fazer login. Se nao chegar, verifique spam.'
        );
        return;
      }

      showSuccess('Conta criada', 'Cadastro concluido. Vamos finalizar seu perfil.');
      router.replace('/(auth)/setup');
    } catch (error) {
      const message = 'Nao foi possivel criar a conta.';
      setErrorText(message);
      showError('Erro no cadastro', error, message);
    } finally {
      setLoading(false);  
    }
  };  
  
  return (  
    <View style={styles.screen}>  
      <View style={styles.card}>  
        <Text style={styles.brand}>CARTOLA</Text>  
        <Text style={styles.title}>Criar conta</Text>  
        <TextInput style={styles.input} placeholder='Email' placeholderTextColor='#8d8d8d' autoCapitalize='none' keyboardType='email-address' value={email} onChangeText={setEmail} />  
        <TextInput style={styles.input} placeholder='Senha' placeholderTextColor='#8d8d8d' secureTextEntry value={password} onChangeText={setPassword} />  
        <TextInput style={styles.input} placeholder='Nome de usuario' placeholderTextColor='#8d8d8d' value={username} onChangeText={setUsername} />  
        <TextInput style={styles.input} placeholder='Nome do time' placeholderTextColor='#8d8d8d' value={teamName} onChangeText={setTeamName} />  
        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={onRegister} disabled={loading}>  
          {loading ? <ActivityIndicator color='#fff' /> : <Text style={styles.buttonText}>Cadastrar</Text>}  
        </Pressable>  
        {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}  
        <Text style={styles.footer}>Ja tem conta? <Link href='/login' style={styles.link}>Entrar</Link></Text>  
      </View>  
    </View>  
  );  
}  
  
const styles = StyleSheet.create({  
  screen: { flex: 1, backgroundColor: '#0b0b0b', justifyContent: 'center', padding: 20 },  
  card: { backgroundColor: '#141414', borderColor: '#2d2d2d', borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },  
  brand: { color: '#f5f5f5', fontSize: 12, fontWeight: '700', letterSpacing: 2 },  
  title: { color: '#ffffff', fontSize: 30, fontWeight: '700', marginBottom: 6 },  
  input: { backgroundColor: '#0c0c0c', borderColor: '#3d3d3d', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, color: '#fff' },  
  button: { marginTop: 10, backgroundColor: '#b91c1c', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },  
  buttonDisabled: { opacity: 0.65 },  
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },  
  errorText: { color: '#f87171', fontSize: 13 },  
  footer: { color: '#d0d0d0', textAlign: 'center', marginTop: 6 },  
  link: { color: '#ef4444', fontWeight: '700' },  
}); 
