import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { showAlert } from '../../src/utils/showAlert';
import { useTheme } from "../../src/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors, isDark } = useTheme();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [submitting,setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("Errore","Inserisci email e password");
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (e:any) {
      showAlert("Login fallito", e?.response?.data?.message || e.message || "Errore");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Text style={[styles.title, { color: colors.text }]}>Accedi a Swesh</Text>
      <TextInput 
        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} 
        placeholder="Email" 
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none" 
        keyboardType="email-address" 
        value={email} 
        onChangeText={setEmail}
      />
      <TextInput 
        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} 
        placeholder="Password" 
        placeholderTextColor={colors.textSecondary}
        secureTextEntry 
        value={password} 
        onChangeText={setPassword}
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleLogin} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Accedi</Text>}
      </TouchableOpacity>
      <Link href="/register" style={[styles.link, { color: colors.accent }]}>Non hai un account? Registrati</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, justifyContent:"center", padding:24 },
  title:{ fontSize:26, fontWeight:"bold", marginBottom:24, textAlign:"center" },
  input:{ borderWidth:1, borderRadius:8, padding:12, marginBottom:12 },
  button:{ padding:14, borderRadius:8, alignItems:"center" },
  buttonText:{ color:"#fff", fontWeight:"bold" },
  link:{ marginTop:16, textAlign:"center" }
});