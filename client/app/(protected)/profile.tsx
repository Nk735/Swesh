import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator, Platform, Alert as RNAlert } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { api } from "../../src/services/apiClient";
import { Item } from "../../src/types";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const CATEGORY_OPTIONS = ["shirt", "pants", "shoes", "jacket", "accessory", "other"] as const;

export default function ProfileScreen() {
  const { user } = useAuth();

  // Stati per il form di inserimento
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [size, setSize] = useState<typeof SIZE_OPTIONS[number] | "">("M");
  const [category, setCategory] = useState<typeof CATEGORY_OPTIONS[number] | "">("other");
  const [loading, setLoading] = useState(false);

  // Stato per la lista dei propri abiti
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Carica gli abiti dell'utente corrente
  const fetchMyItems = async () => {
    setLoadingItems(true);
    try {
      const mine = (await api.get("/items/mine")).data;
      setMyItems(mine);
    } catch (e: any) {
      setMyItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (user) fetchMyItems();
  }, [user]);

  // Utility per mostrare alert sia su mobile che su web
  function showAlert(title: string, message?: string) {
    if (Platform.OS === "web") {
      // Fallback semplice per web
      window.alert(`${title}${message ? "\n\n" + message : ""}`);
    } else {
      RNAlert.alert(title, message);
    }
  }

  const isValidUrl = (url: string) => /^https?:\/\//i.test(url);

  const handleAddItem = async () => {
    if (!title || !imageUrl) {
      showAlert("Errore", "Titolo e immagine sono obbligatori");
      return;
    }
    if (!isValidUrl(imageUrl)) {
      showAlert("Errore", "L'URL immagine deve iniziare con http:// o https://");
      return;
    }
    setLoading(true);
    try {
      const payload: any = { title, imageUrl };
      if (size) payload.size = size;
      if (category) payload.category = category;

      await api.post("/items", payload);
      showAlert("Successo", "Abito aggiunto!");
      setTitle("");
      setImageUrl("");
      setSize("M");
      setCategory("other");
      await fetchMyItems();
    } catch (e: any) {
      showAlert("Errore", e?.response?.data?.message || e.message || "Errore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profilo</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Nickname: {user?.nickname}</Text>

      <View style={styles.form}>
        <Text style={styles.subtitle}>Aggiungi un nuovo abito</Text>
        <TextInput style={styles.input} placeholder="Titolo" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="URL immagine" value={imageUrl} onChangeText={setImageUrl} />

        <Text style={styles.label}>Taglia</Text>
        <View style={styles.chipsRow}>
          {SIZE_OPTIONS.map(opt => {
            const selected = size === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setSize(opt)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 10 }]}>Categoria</Text>
        <View style={styles.chipsRow}>
          {CATEGORY_OPTIONS.map(opt => {
            const selected = category === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setCategory(opt)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAddItem} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Salvataggio..." : "Aggiungi abito"}</Text>
        </TouchableOpacity>
      </View>

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
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={async () => {
                  try {
                    await api.delete(`/items/${item._id}`);
                    await fetchMyItems();
                    showAlert("Abito eliminato");
                  } catch (e:any) {
                    showAlert("Errore", e?.response?.data?.message || e.message || "Errore");
                  }
                }}
              >
                <Text style={{ color: "#FF6347", fontWeight: "bold" }}>Elimina</Text>
              </TouchableOpacity>
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
  label: { fontSize:14, color:"#444", marginBottom:6, marginTop:4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingVertical:6, paddingHorizontal:10, borderRadius:16, borderWidth:1, borderColor:'#ccc', backgroundColor:'#fff' },
  chipSelected: { backgroundColor:'#5A31F4', borderColor:'#5A31F4' },
  chipText: { color:'#333' },
  chipTextSelected: { color:'#fff', fontWeight:'600' },
  button: { backgroundColor:"#5A31F4", padding:12, borderRadius:8, alignItems:"center", marginTop:8 },
  buttonText: { color:"#fff", fontWeight:"bold" },
  itemBox: { marginRight:14, alignItems:"center", width:130 },
  itemImage: { width:110, height:110, borderRadius:8, marginBottom:4, backgroundColor:"#eee" },
  itemTitle: { fontWeight:"600", textAlign:"center" },
  itemMeta: { color:"#555", fontSize:12, textAlign:"center" },
  deleteButton: { marginTop: 8, padding: 6, backgroundColor: "#ffeaea", borderRadius: 8, alignItems: "center" }
});