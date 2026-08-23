import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InventoryItem } from '../../types/types';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const apiUrl = process.env.EXPO_PUBLIC_APP_URL;

      if (!token) {
        console.log("No token in storage, redirecting...");
        router.replace('/pages/Login');
        return;
      }

      if (!token || !apiUrl) {
        console.log('Token is missing. Cannot fetch dashboard data.');
        return;
      }

      // 1. Fetch User Profile
      const profileRes = await fetch(`${apiUrl}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      if (profileData.success) {
        setProfile(profileData.user);
      }

      // 2. Fetch Live Inventory
      const inventoryRes = await fetch(`${apiUrl}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const inventoryData = await inventoryRes.json();
      if (inventoryData.success) {
        setInventory(inventoryData.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  // Calculated Real-Time Metrics
  const totalUnits = inventory.reduce((sum, item) => sum + (item.stockCount || 0), 0);
  const lowStockCount = inventory.filter((item) => (item.stockCount || 0) < 3).length;
  const totalInventoryValue = inventory.reduce((sum, item) => sum + ((item.stockCount || 0) * (item.unitPrice || 0)), 0);

  const formattedInventoryValue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(totalInventoryValue);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#4F46E5" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
            ) : (
              <Text style={styles.businessName}>{profile?.businessCategory || 'My Business'}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push('/pages/Profile')}
          >
            <Ionicons name="person-circle" size={44} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* AI Co-Pilot Briefing */}
        <View style={styles.copilotCard}>
          <View style={styles.copilotHeader}>
            <Ionicons name="sparkles" size={20} color="#F59E0B" />
            <Text style={styles.copilotTitle}>Co-Pilot Briefing</Text>
          </View>
          <Text style={styles.copilotText}>
            • Total catalog: <Text style={styles.boldText}>{inventory.length} distinct items</Text> logged.
          </Text>
          <Text style={styles.copilotText}>
            • New <Text style={styles.boldText}>{profile?.region || 'Local'} MSME Subsidy</Text> matches your business profile.
          </Text>
          {lowStockCount > 0 ? (
            <Text style={styles.copilotText}>
              • Alert: <Text style={styles.boldText}>{lowStockCount} items</Text> have low stock (&lt; 3 units).
            </Text>
          ) : (
            <Text style={styles.copilotText}>• Stock levels are healthy across all logged products.</Text>
          )}
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="cube-outline" size={20} color="#6B7280" />
            <Text style={styles.metricValue}>{totalUnits}</Text>
            <Text style={styles.metricLabel}>Total Units in Stock</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="wallet-outline" size={20} color="#10B981" />
            <Text style={styles.metricValue}>{formattedInventoryValue}</Text>
            <Text style={styles.metricLabel}>Inventory Value</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/pages/Camera')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="scan" size={28} color="#4F46E5" />
            </View>
            <Text style={styles.actionText}>Scan(add/sell) Shipment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/pages/Inventory')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="cube-outline" size={28} color="#4F46E5" />
            </View>
            <Text style={styles.actionText}>View Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/pages/Schemes')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="document-text-outline" size={28} color="#EF4444" />
            </View>
            <Text style={styles.actionText}>Govt Schemes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.iconWrapper, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="share-social-outline" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>Share Catalog</Text>
          </TouchableOpacity>
        </View>

        {/* Recently Logged Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Logged</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.seeAllText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {inventory.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={36} color="#9CA3AF" />
              <Text style={styles.emptyText}>No items scanned yet.</Text>
            </View>
          ) : (
            inventory.slice(0, 5).map((item) => (
              <View key={item._id} style={styles.listItem}>
                <View style={styles.itemIcon}>
                  <Ionicons name="pricetag-outline" size={22} color="#4F46E5" />
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemDate}>{item.category} • ₹{item.unitPrice || 0}/unit</Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={styles.itemStock}>{item.stockCount} in stock</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContainer: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { fontSize: 16, color: '#6B7280', marginBottom: 4 },
  businessName: { fontSize: 26, fontWeight: '800', color: '#111827' },
  profileBtn: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  copilotCard: { backgroundColor: '#111827', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  copilotHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  copilotTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  copilotText: { color: '#D1D5DB', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  boldText: { color: '#ffffff', fontWeight: 'bold' },
  metricsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  metricCard: { flex: 1, backgroundColor: '#ffffff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  metricLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 4 },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  seeAllText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  actionButton: { width: (width - 64) / 2, backgroundColor: '#ffffff', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  iconWrapper: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  listContainer: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemIcon: { width: 44, height: 44, backgroundColor: '#EEF2FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  itemDate: { fontSize: 13, color: '#6B7280' },
  stockBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  itemStock: { fontSize: 13, fontWeight: '700', color: '#374151' },
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 8, color: '#9CA3AF', fontSize: 14 }
});