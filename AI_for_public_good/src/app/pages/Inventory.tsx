import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface InventoryItem {
  _id: string;
  itemName: string;
  description: string;
  category: string;
  stockCount: number;
  unitPrice: number;
}

export default function InventoryScreen() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- NEW: Search & Filter State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- NEW: Edit Modal State ---
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [velocityData, setVelocityData] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchInventory();
    fetchVelocity(); // <-- Add this
  }, []);

  const fetchVelocity = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const apiUrl = process.env.EXPO_PUBLIC_APP_URL;
      
      const response = await fetch(`${apiUrl}/api/transaction/velocity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const json = await response.json();
      if (json.success) {
        setVelocityData(json.data);
      }
    } catch (error) {
      console.log("Could not fetch velocity data", error);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const apiUrl = process.env.EXPO_PUBLIC_APP_URL;

      if (!token) {
        router.replace('/pages/Login');
        return;
      }

      const response = await fetch(`${apiUrl}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const json = await response.json();

      if (json.success) {
        setInventory(json.data);
      } else {
        setError('Failed to load inventory.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: Dynamic Filtering Logic ---
  const categories = ['All', ...Array.from(new Set(inventory.map(item => item.category)))];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate totals based on the FILTERED items
  const totalItems = filteredInventory.reduce((sum, item) => sum + item.stockCount, 0);
  const totalValue = filteredInventory.reduce((sum, item) => sum + (item.stockCount * item.unitPrice), 0);

  // --- NEW: Edit Logic ---
  const openEditModal = (item: InventoryItem) => {
    setEditingItem({ ...item }); // Create a copy so we don't mutate state directly
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSaving(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      const apiUrl = process.env.EXPO_PUBLIC_APP_URL;

      // Note: You will need a PUT route on your backend to handle this!
      const response = await fetch(`${apiUrl}/api/inventory/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingItem)
      });

      const json = await response.json();

      if (json.success) {
        // Update local state instantly
        setInventory(prev => prev.map(item => item._id === editingItem._id ? editingItem : item));
        setEditModalVisible(false);
        Alert.alert("Success", "Item updated successfully!");
      } else {
        Alert.alert('Error', json.error || 'Failed to update item.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error while updating.');
    } finally {
      setIsSaving(false);
    }
  };


  const renderItem = ({ item }: { item: InventoryItem }) => {
    // 1. THE VELOCITY MATH
    const totalSoldLast30Days = velocityData[item.itemName] || 1; 
    
    const dailyVelocity = totalSoldLast30Days / 30;
    const daysRemaining = Math.floor(item.stockCount / dailyVelocity);
    const isRunningOut = daysRemaining <= 7;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.descriptionText}>{item.description}</Text>
          </View>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editButton}>
            <Ionicons name="pencil" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* 2. THE BADGES (Category + Velocity side-by-side) */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          
          <View style={[styles.velocityBadge, isRunningOut && styles.velocityBadgeUrgent]}>
            <Ionicons name={isRunningOut ? "warning" : "trending-down"} size={14} color={isRunningOut ? '#B91C1C' : '#047857'} />
            <Text style={[styles.velocityText, isRunningOut && { color: '#B91C1C' }]}>
              {isRunningOut ? `Stock out in ${daysRemaining} days!` : `${daysRemaining} days left`}
            </Text>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>In Stock</Text>
            <Text style={[styles.statValue, { color: '#4F46E5' }]}>{item.stockCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Est. Price</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>₹{item.unitPrice.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Value</Text>
            <Text style={styles.statValue}>₹{(item.stockCount * item.unitPrice).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Inventory</Text>
        <TouchableOpacity onPress={fetchInventory}>
          <Ionicons name="refresh" size={22} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* NEW: Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* NEW: Dynamic Category Filters */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.filterPill, selectedCategory === cat && styles.filterPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterPillText, selectedCategory === cat && styles.filterPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Total Summary Block */}
      {!loading && !error && inventory.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Stock Items</Text>
            <Text style={styles.summaryValue}>{totalItems}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Est. Portfolio Value</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>₹{totalValue.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      )}

      {/* List / States */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading stock...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInventory}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredInventory.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInventory}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* NEW: Edit Item Modal */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {editingItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Product Name</Text>
                <TextInput style={styles.input} value={editingItem.itemName} onChangeText={(text) => setEditingItem({ ...editingItem, itemName: text })} />

                <Text style={styles.label}>Category</Text>
                <TextInput style={styles.input} value={editingItem.category} onChangeText={(text) => setEditingItem({ ...editingItem, category: text })} />

                <Text style={styles.label}>Description</Text>
                <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} multiline value={editingItem.description} onChangeText={(text) => setEditingItem({ ...editingItem, description: text })} />

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Stock Count</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={String(editingItem.stockCount)} onChangeText={(text) => setEditingItem({ ...editingItem, stockCount: Number(text) || 0 })} />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Unit Price (₹)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={String(editingItem.unitPrice)} onChangeText={(text) => setEditingItem({ ...editingItem, unitPrice: Number(text) || 0 })} />
                  </View>
                </View>

                <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} onPress={handleSaveEdit} disabled={isSaving}>
                  <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  velocityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4 },
  velocityBadgeUrgent: { backgroundColor: '#FEE2E2' },
  velocityText: { color: '#047857', fontSize: 12, fontWeight: '700' },

  /* Search & Filter Styles */
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', marginHorizontal: 16, marginTop: 16, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },
  filterWrapper: { marginTop: 12 },
  filterScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E5E7EB' },
  filterPillActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  filterPillText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  filterPillTextActive: { color: '#ffffff' },

  summaryContainer: { flexDirection: 'row', backgroundColor: '#ffffff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryBox: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
  summaryLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' },
  summaryValue: { fontSize: 22, fontWeight: '800', color: '#111827' },

  listContainer: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  itemName: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, marginRight: 12 },
  descriptionText: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  editButton: { padding: 6, backgroundColor: '#F3F4F6', borderRadius: 8 },
  categoryBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { color: '#4F46E5', fontSize: 12, fontWeight: '600' },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4, fontWeight: '500' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 15 },
  errorText: { color: '#EF4444', fontSize: 16, marginBottom: 16 },
  retryButton: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#ffffff', fontWeight: '600' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center' },

  /* Modal Styles */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  label: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  saveBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' }
});