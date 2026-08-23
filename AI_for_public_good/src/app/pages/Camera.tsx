import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, Modal, Animated, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Fuse from 'fuse.js';

interface DetectedItem {
  itemName: string;
  category: string;
  description: string;
  stockCount: string;
  unitPrice: string;
  inDbStock: number;
}

export default function CameraScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [items, setItems] = useState<DetectedItem[]>([]);

  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const apiUrl = process.env.EXPO_PUBLIC_APP_URL;
        const res = await fetch(`${apiUrl}/api/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setInventoryData(json.data);
        }
      } catch (e) {
        console.log("Could not fetch inventory.");
      }
    };
    fetchInventory();
  }, []);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Camera access is needed.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].base64);
    }
  };

  const analyzeImage = async (base64String: string) => {
    setIsAnalyzing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const apiUrl = process.env.EXPO_PUBLIC_APP_URL;

      const response = await fetch(`${apiUrl}/api/analyze-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64String }),
      });

      const json = await response.json();

      if (json.success && Array.isArray(json.items)) {
        const fuse = new Fuse(inventoryData, { keys: ['itemName'], includeScore: true, threshold: 0.4 });

        const matchedItems = json.items.map((item: any) => {
          const searchResult = fuse.search(item.itemName);
          const match = searchResult.length > 0 ? searchResult[0].item : null;

          return {
            itemName: match ? match.itemName : (item.itemName || ''),
            category: match ? match.category : (item.category || 'Uncategorized'),
            description: match ? match.description : (item.description || ''),
            stockCount: String(item.stockCount || 1),
            unitPrice: match ? String(match.unitPrice) : String(item.unitPrice || 0),
            inDbStock: match ? Number(match.stockCount) : 0,
          };
        });

        // Add scanned items to existing items in case they manually searched first
        setItems(prev => [...prev, ...matchedItems]);
      } else {
        Alert.alert('Analysis Failed', 'Could not detect items.');
      }
    } catch {
      Alert.alert('Error', 'Network connection failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateItem = (index: number, field: keyof DetectedItem, value: string) => {
    setItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const triggerSuccessAnimation = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    Animated.spring(checkmarkScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
    setTimeout(() => {
      setShowSuccess(false);
      router.back();
    }, 1500);
  };

  const confirmAddStock = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Add ${items.length} items to your inventory?`)) executeAddStock();
      return;
    }
    Alert.alert("Confirm Inbound", `Add ${items.length} items to your inventory?`, [
      { text: "Cancel", style: "cancel" }, { text: "Confirm", onPress: executeAddStock, style: "default" }
    ]);
  };

  const confirmDeductStock = () => {
    const invalidItems = items.filter(item => Number(item.stockCount) > item.inDbStock);

    if (invalidItems.length > 0) {
      const names = invalidItems.map(i => i.itemName).join(', ');
      Alert.alert(
        "Insufficient Stock",
        `You cannot deduct more than you have.\n\nNot enough stock for: ${names}. Please adjust the quantities.`
      );
      return; 
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Deduct these items from your inventory?`)) executeDeductStock();
      return;
    }
    Alert.alert("Confirm Outbound", `Deduct these items from your inventory?`, [
      { text: "Cancel", style: "cancel" }, { text: "Confirm", onPress: executeDeductStock, style: "destructive" }
    ]);
  };

  const executeAddStock = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const apiUrl = process.env.EXPO_PUBLIC_APP_URL;

      const response = await fetch(`${apiUrl}/api/inventory/bulk`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({ ...item, stockCount: Number(item.stockCount) || 1, unitPrice: Number(item.unitPrice) || 0 })),
        }),
      });

      const json = await response.json();
      if (json.success) triggerSuccessAnimation("Stock Added Successfully!");
      else Alert.alert('Failed', json.error || 'Could not add items.');
    } catch {
      Alert.alert('Error', 'Network error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDeductStock = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const apiUrl = process.env.EXPO_PUBLIC_APP_URL;

      const response = await fetch(`${apiUrl}/api/inventory/deduct`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({ itemName: item.itemName, stockCount: Number(item.stockCount) || 1 })),
        }),
      });

      const json = await response.json();
      if (json.success) triggerSuccessAnimation("Stock Deducted Successfully!");
      else Alert.alert('Failed', json.error || 'Could not deduct items.');
    } catch {
      Alert.alert('Error', 'Network error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Scan</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        {/* 1. CAMERA OR IMAGE SECTION */}
        {!imageUri ? (
          <View style={styles.emptyState}>
            <View style={styles.iconCircle}>
              <Ionicons name="scan-outline" size={48} color="#4F46E5" />
            </View>
            <Text style={styles.emptyTitle}>Inbound or Outbound?</Text>
            <Text style={styles.emptyText}>Take a photo of your items to log them automatically, or search below.</Text>
            <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
              <Text style={styles.captureBtnText}>Open Camera</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity 
              style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 }}
              onPress={() => setImageUri(null)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* 2. MANUAL SEARCH SECTION */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search inventory manually..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSearchResults(text.length > 0);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* SEARCH RESULTS DROPDOWN */}
          {showSearchResults && (
            <View style={styles.searchResultsContainer}>
              {inventoryData
                .filter(item => item.itemName.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 4)
                .map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResultItem}
                    onPress={() => {
                      // 1. Add explicitly to main array with all TypeScript fields satisfied
                      setItems(prevItems => [
                        ...prevItems,
                        {
                          itemName: item.itemName,
                          stockCount: '1',
                          category: item.category || 'Manual Entry',
                          description: item.description || '',
                          unitPrice: String(item.unitPrice || 0),
                          inDbStock: Number(item.stockCount) || 0
                        }
                      ]);
                      // 2. Hide dropdown
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#4F46E5" />
                    <Text style={styles.searchResultText}>{item.itemName}</Text>
                  </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 3. PENDING ITEMS LIST & ACTION BUTTONS */}
        {isAnalyzing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>AI is calculating quantities & market prices...</Text>
          </View>
        ) : items.length > 0 ? (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Ready for Scan ({items.length})</Text>

            {items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.badgeText}>Item #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Product Name</Text>
                <TextInput style={styles.input} value={item.itemName} onChangeText={(val) => updateItem(index, 'itemName', val)} />
                <Text style={styles.stockStatusText}>
                  Warehouse Stock: <Text style={{ fontWeight: '700', color: item.inDbStock > 0 ? '#10B981' : '#EF4444' }}>{item.inDbStock}</Text>
                </Text>

                <Text style={styles.label}>Category</Text>
                <TextInput style={styles.input} value={item.category} onChangeText={(val) => updateItem(index, 'category', val)} />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                  multiline={true}
                  value={item.description}
                  onChangeText={(val) => updateItem(index, 'description', val)}
                />

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Qty Detected</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={item.stockCount} onChangeText={(val) => updateItem(index, 'stockCount', val)} />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Price (₹)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={item.unitPrice} onChangeText={(val) => updateItem(index, 'unitPrice', val)} />
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }, isProcessing && { opacity: 0.7 }]} onPress={confirmAddStock} disabled={isProcessing}>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Add Inbound</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }, isProcessing && { opacity: 0.7 }]} onPress={confirmDeductStock} disabled={isProcessing}>
                <Ionicons name="push-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Deduct Outbound</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* SUCCESS MODAL */}
      <Modal transparent={true} visible={showSuccess} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
              <Ionicons name="checkmark-circle" size={96} color="#10B981" />
            </Animated.View>
            <Text style={styles.successMessage}>{successMessage}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  container: { padding: 20, paddingBottom: 50 },
  
  emptyState: { justifyContent: 'center', alignItems: 'center', paddingVertical: 20, marginTop: 10 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  captureBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  captureBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  
  previewImage: { width: '100%', height: 200, borderRadius: 14, marginTop: 10 },
  loadingBox: { padding: 32, alignItems: 'center', marginTop: 20 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280', textAlign: 'center' },
  
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  itemCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  label: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 4 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, fontSize: 15, color: '#111827', marginBottom: 4 },
  stockStatusText: { fontSize: 11, color: '#6B7280', marginBottom: 16, marginLeft: 2 },
  
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  successCard: { backgroundColor: '#ffffff', padding: 40, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  successMessage: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#111827' },

  searchSection: { marginTop: 24, zIndex: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#111827' },
  searchResultsContainer: { backgroundColor: '#ffffff', borderRadius: 12, marginTop: 8, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchResultText: { marginLeft: 12, fontSize: 15, color: '#374151', fontWeight: '500' }
});