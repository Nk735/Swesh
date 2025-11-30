import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert as RNAlert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/services/apiClient";
import { useAuth } from "../../src/context/AuthContext";
import { ItemVisibility } from "../../src/types";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const CATEGORY_OPTIONS = ["shirt", "pants", "shoes", "jacket", "accessory", "other"] as const;
const CONDITION_OPTIONS = [
  { value: "new", label: "Nuovo" },
  { value: "excellent", label: "Ottimo" },
  { value: "good", label: "Buono" },
] as const;

const VISIBILITY_OPTIONS: { value: ItemVisibility; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "male", label: "Uomini", icon: "male" },
  { value: "female", label: "Donne", icon: "female" },
  { value: "all", label: "Tutti", icon: "people" },
];

export default function AddItemScreen() {
  const { user } = useAuth();
  
  // Calculate default visibility based on user gender
  const getDefaultVisibility = (): ItemVisibility => {
    if (user?.gender === 'male') return 'male';
    if (user?.gender === 'female') return 'female';
    return 'all';
  };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [size, setSize] = useState<typeof SIZE_OPTIONS[number] | "">("M");
  const [category, setCategory] = useState<typeof CATEGORY_OPTIONS[number] | "">("other");
  const [condition, setCondition] = useState<"new" | "excellent" | "good">("good");
  const [visibleTo, setVisibleTo] = useState<ItemVisibility>(getDefaultVisibility());
  const [loading, setLoading] = useState(false);

  function showAlert(title: string, message?: string) {
    if (Platform.OS === "web") {
      window.alert(`${title}${message ? "\n\n" + message : ""}`);
    } else {
      RNAlert.alert(title, message);
    }
  }

  const isValidUrl = (url: string) => /^https?:\/\//i.test(url);

  const addImageField = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const removeImageField = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleAddItem = async () => {
    // Filtra solo URL non vuoti
    const validUrls = imageUrls.filter(url => url.trim() !== "");

    if (!title) {
      showAlert("Errore", "Titolo è obbligatorio");
      return;
    }

    if (validUrls.length === 0) {
      showAlert("Errore", "Almeno un'immagine è obbligatoria");
      return;
    }

    // Valida tutti gli URL
    for (const url of validUrls) {
      if (!isValidUrl(url)) {
        showAlert("Errore", "Tutti gli URL immagine devono iniziare con http:// o https://");
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        title,
        images: validUrls,
        imageUrl: validUrls[0], // Per compatibilità
        isAvailable: true,
      };

      if (description) payload.description = description;
      if (size) payload.size = size;
      if (category) payload.category = category;
      if (condition) payload.condition = condition;
      if (visibleTo) payload.visibleTo = visibleTo;

      await api.post("/items", payload);
      showAlert("Successo", "Abito aggiunto!");
      router.back();
    } catch (e: any) {
      showAlert("Errore", e?.response?.data?.message || e.message || "Errore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#86A69D" />
        </TouchableOpacity>
        <Text style={styles.title}>Aggiungi un nuovo abito</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Titolo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. Giacca di pelle nera"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Descrizione</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descrizione dettagliata del capo (max 600 caratteri)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={600}
        />

        <Text style={styles.label}>Immagini *</Text>
        {imageUrls.map((url, index) => (
          <View key={index} style={styles.imageInputRow}>
            <TextInput
              style={[styles.input, styles.imageInput]}
              placeholder={`URL immagine ${index + 1}`}
              value={url}
              onChangeText={(value) => updateImageUrl(index, value)}
            />
            {imageUrls.length > 1 && (
              <TouchableOpacity
                onPress={() => removeImageField(index)}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={24} color="#FF6347" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity onPress={addImageField} style={styles.addImageButton}>
          <Ionicons name="add-circle-outline" size={20} color="#86A69D" />
          <Text style={styles.addImageText}>Aggiungi altra immagine</Text>
        </TouchableOpacity>

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

        <Text style={[styles.label, { marginTop: 10 }]}>Condizione *</Text>
        <View style={styles.chipsRow}>
          {CONDITION_OPTIONS.map(opt => {
            const selected = condition === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setCondition(opt.value)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { marginTop: 10 }]}>Chi può vedere questo abito?</Text>
        <View style={styles.chipsRow}>
          {VISIBILITY_OPTIONS.map(opt => {
            const selected = visibleTo === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setVisibleTo(opt.value)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <View style={styles.visibilityChipContent}>
                  <Ionicons 
                    name={opt.icon} 
                    size={16} 
                    color={selected ? "#fff" : "#333"} 
                    style={styles.visibilityIcon}
                  />
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAddItem} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Salvataggio..." : "Aggiungi abito"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2E8DF" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 50 },
  backButton: { marginRight: 12 },
  title: { fontSize: 22, fontWeight: "600" },
  form: { padding: 20, paddingTop: 0 },
  label: { fontSize: 14, color: "#444", marginBottom: 6, marginTop: 12, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 },
  textArea: { height: 100, textAlignVertical: "top" },
  imageInputRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  imageInput: { flex: 1, marginBottom: 0 },
  removeButton: { marginLeft: 8 },
  addImageButton: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  addImageText: { marginLeft: 8, color: "#86A69D", fontWeight: "500" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "#ccc", backgroundColor: "#fff" },
  chipSelected: { backgroundColor: "#F28585", borderColor: "#F28585" },
  chipText: { color: "#333", fontSize: 14 },
  chipTextSelected: { color: "#fff", fontWeight: "600" },
  visibilityChipContent: { flexDirection: "row", alignItems: "center" },
  visibilityIcon: { marginRight: 6 },
  button: { backgroundColor: "#F2B263", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
