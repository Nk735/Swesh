// src/screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Errore', 'Inserisci email e password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      // Al successo, RootNavigator mostrerà AppStack
    } catch (e) {
      Alert.alert('Login fallito', e.message || 'Credenziali non valide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accedi a Swesh</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading
          ? <ActivityIndicator />
          : <Text style={styles.buttonText}>Accedi</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Non hai un account? Registrati</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:20 },
  title:     { fontSize:24, fontWeight:'bold', marginBottom:20, textAlign:'center' },
  input:     { borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:12, marginBottom:12 },
  button:    { backgroundColor:'#007AFF', borderRadius:8, padding:12, alignItems:'center' },
  buttonText:{ color:'#fff', fontWeight:'bold' },
  link:      { marginTop:16, color:'#007AFF', textAlign:'center' },
});
