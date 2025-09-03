import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, Image, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { api } from "../../src/services/apiClient";

type Item = {
  _id: string;
  title: string;
  imageUrl: string;
  size?: string;
  category?: string;
};

export default function ProfileScreen() {
  const { user } = useAuth();

  // Stati per il form di inserimento
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [size, setSize] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  // Stato per la lista dei propri abiti
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Carica gli abiti dell'utente corrente
  useEffect(() => {
    const fetchMyItems = async () => {
      setLoadingItems(true);
      try {
        // Prendi tutti gli item e filtra quelli dell'utente corrente
        const all = (await api.get("/items?all=1")).data;
        const mine = (await api.get("/items/mine")).data;
        setMyItems(mine);
      } catch (e: any) {
        setMyItems([]);
      } finally {
        setLoadingItems(false);
      }
    };
    if (user) fetchMyItems();
  }, [user]);

  const handleAddItem = async () => {
    if (!title || !imageUrl) {
      Alert.alert("Errore", "Titolo e immagine sono obbligatori");
      return;
    }
    setLoading(true);
    try {
      await api.post("/items", { title, imageUrl, size, category });
      Alert.alert("Successo", "Abito aggiunto!");
      setTitle(""); setImageUrl(""); setSize(""); setCategory("");
      // Aggiorna la lista dei propri abiti
      const all = (await api.get("/items?all=1")).data;
      const mine = all.filter((item: any) => item.owner?._id === user?.id);
      setMyItems(mine);
    } catch (e: any) {
      Alert.alert("Errore", e?.response?.data?.message || e.message || "Errore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profilo</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Nickname: {user?.nickname}</Text>
      {/* Form per inserimento nuovo abito */}
      <View style={styles.form}>
        <Text style={styles.subtitle}>Aggiungi un nuovo abito</Text>
        <TextInput style={styles.input} placeholder="Titolo" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="URL immagine" value={imageUrl} onChangeText={setImageUrl} />
        <TextInput style={styles.input} placeholder="Taglia (opzionale)" value={size} onChangeText={setSize} />
        <TextInput style={styles.input} placeholder="Categoria (opzionale)" value={category} onChangeText={setCategory} />
        <TouchableOpacity style={styles.button} onPress={handleAddItem} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Salvataggio..." : "Aggiungi abito"}</Text>
        </TouchableOpacity>
      </View>
      {/* Lista dei propri abiti */}
      <Text style={styles.subtitle}>I tuoi abiti</Text>
      {loadingItems ? (
        <ActivityIndicator color="#888" />
      ) : (
        <FlatList
          data={myItems}
          keyExtractor={item => item._id}
          horizontal
          renderItem={({ item }) => (
            <View style={styles.itemBox}>
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              <Text style={styles.itemTitle}>{item.title}</Text>
              {item.size ? <Text style={styles.itemMeta}>Taglia: {item.size}</Text> : null}
              {item.category ? <Text style={styles.itemMeta}>Categoria: {item.category}</Text> : null}
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: "#aaa" }}>Non hai ancora inserito abiti</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20 },
  title: { fontSize:22, fontWeight:"600", marginBottom:8 },
  subtitle: { fontSize:18, fontWeight:"500", marginTop:18, marginBottom:8 },
  form: { marginTop:14, marginBottom:18 },
  input: { borderWidth:1, borderColor:"#ccc", borderRadius:8, padding:10, marginBottom:10 },
  button: { backgroundColor:"#5A31F4", padding:12, borderRadius:8, alignItems:"center" },
  buttonText: { color:"#fff", fontWeight:"bold" },
  itemBox: { marginRight:14, alignItems:"center", width:130 },
  itemImage: { width:110, height:110, borderRadius:8, marginBottom:4, backgroundColor:"#eee" },
  itemTitle: { fontWeight:"600", textAlign:"center" },
  itemMeta: { color:"#555", fontSize:12, textAlign:"center" }
});