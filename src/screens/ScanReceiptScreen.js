import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { receiptService } from '../services/api';

export default function ScanReceiptScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Sprawdź aktualny status uprawnień
    const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();
    let finalStatus = existingStatus;

    // Jeśli nie ma uprawnień, poproś o nie
    if (existingStatus !== 'granted') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Brak uprawnień',
        'Aplikacja potrzebuje dostępu do aparatu. Przejdź do Ustawień > Expo Go i włącz dostęp do Aparatu.',
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'OK' }
        ]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    // Sprawdź aktualny status uprawnień
    const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
    let finalStatus = existingStatus;

    // Jeśli nie ma uprawnień, poproś o nie
    if (existingStatus !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Brak uprawnień',
        'Aplikacja potrzebuje dostępu do galerii. Przejdź do Ustawień > Expo Go i włącz dostęp do Zdjęć.',
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Otwórz Ustawienia', onPress: () => {
            // Dla iOS/Android możesz użyć Linking.openSettings()
            // ale wymaga to importu: import { Linking } from 'react-native';
            Alert.alert('Instrukcja', 'Otwórz Ustawienia telefonu > Expo Go > Zezwolenia > Zdjęcia');
          }}
        ]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadReceipt = async () => {
    if (!image) {
      Alert.alert('Błąd', 'Najpierw zrób zdjęcie paragonu');
      return;
    }

    setLoading(true);
    try {
      console.log('Uploading receipt:', image);
      const response = await receiptService.scanReceipt(image);
      console.log('Receipt response:', response);
      Alert.alert(
        'Sukces!',
        `Paragon zeskanowany!\nZdobyte punkty: ${response.points_earned || 0}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setImage(null);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Upload error full:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Nie udało się zeskanować paragonu';
      Alert.alert('Błąd', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.preview} />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setImage(null)}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Anuluj</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={uploadReceipt}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Wyślij</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actionsContainer}>
          <Text style={styles.title}>Zeskanuj paragon</Text>
          <Text style={styles.subtitle}>
            Zrób zdjęcie paragonu aby zdobyć punkty
          </Text>

          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Zrób zdjęcie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={pickFromGallery}
          >
            <Text style={styles.secondaryButtonText}>
              Wybierz z galerii
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  actionsContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
});
