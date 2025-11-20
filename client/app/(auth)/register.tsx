import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { showAlert } from '../../src/utils/showAlert';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [nickname,setNickname] = useState("");
  const [submitting,setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !nickname) {
      showAlert("Errore","Compila tutti i campi");
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password, nickname);
    } catch (e:any) {
      showAlert("Registrazione fallita", e?.response?.data?.message || e.message || "Errore");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrati su Swesh</Text>
      <TextInput style={styles.input} placeholder="Nickname" value={nickname} onChangeText={setNickname}/>
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword}/>
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registrati</Text>}
      </TouchableOpacity>
      <Link href="/login" style={styles.link}>Hai già un account? Accedi</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ backgroundColor:"#F2E8DF", flex:1, justifyContent:"center", padding:24 },
  title:{ fontSize:26, fontWeight:"bold", marginBottom:24, textAlign:"center" },
  input:{ borderWidth:1, borderColor:"#ccc", borderRadius:8, padding:12, marginBottom:12 },
  button:{ backgroundColor:"#F28585", padding:14, borderRadius:8, alignItems:"center" },
  buttonText:{ color:"#fff", fontWeight:"bold" },
  link:{ marginTop:16, color:"#007AFF", textAlign:"center" }
});