import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SchemesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schemeData, setSchemeData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const apiUrl = process.env.EXPO_PUBLIC_APP_URL;

      if (!token) {
        router.replace('/pages/Login');
        return;
      }

      // First, fetch the user profile to get their specific business data
      const profileRes = await fetch(`${apiUrl}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileJson = await profileRes.json();
      const user = profileJson.data;

      // Now, ask the AI to search for schemes matching this profile
      const schemeRes = await fetch(`${apiUrl}/api/schemes/match`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          businessCategory: user?.businessName || 'Manufacturing',
          region: user?.region || 'India',
          inventoryValue: 50000 // Placeholder until we link the live inventory sum
        })
      });
      
      const schemeJson = await schemeRes.json();
      if (schemeJson.success) {
        setSchemeData(schemeJson.data);
      } else {
        setError('Could not fetch schemes at this time.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render individual scheme cards
  // Helper function to render individual scheme cards
  const renderSchemeCard = (scheme: any, levelTitle: string, badgeColor: string, iconName: any) => {
    if (!scheme || !scheme.schemeName) return null;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={[styles.levelBadge, { backgroundColor: badgeColor + '20' }]}> 
            <Text style={[styles.levelBadgeText, { color: badgeColor }]}>{levelTitle}</Text>
          </View>
        </View>

        <View style={styles.cardHeader}>
          <Ionicons name={iconName} size={28} color={badgeColor} style={{ marginTop: 2 }} />
          <Text style={styles.schemeName}>{scheme.schemeName}</Text>
        </View>
        
        <Text style={styles.relevanceText}>{scheme.relevance}</Text>
        
        {/* NEW: Eligibility Box */}
        {scheme.eligibility && (
          <View style={styles.eligibilityBox}>
            <View style={styles.eligibilityHeader}>
              <Ionicons name="checkmark-done-circle" size={18} color="#10B981" />
              <Text style={styles.eligibilityTitle}>Who Qualifies?</Text>
            </View>
            <Text style={styles.eligibilityText}>{scheme.eligibility}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: badgeColor }]}
          onPress={() => {
            if (scheme.link) {
              Linking.openURL(scheme.link).catch(err => console.error("Couldn't load page", err));
            }
          }}
        >
          <Text style={styles.actionButtonText}>{scheme.actionStep}</Text>
          <Ionicons name="arrow-forward" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Govt Schemes</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>AI-Matched Financial Support</Text>
        <Text style={styles.description}>
          We scan live government databases to find grants and subsidies that match your business profile and location.
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Searching regional and central databases...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchSchemes}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : schemeData ? (
          <View style={{ gap: 24 }}>
            {/* 1. Render State Scheme */}
            {renderSchemeCard(
              schemeData.stateScheme, 
              "State Level Policy", 
              "#10B981", // Emerald Green
              "map-outline"
            )}

            {/* 2. Render Central Scheme */}
            {renderSchemeCard(
              schemeData.centralScheme, 
              "Central Gov Policy", 
              "#3B82F6", // Blue
              "business-outline"
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    /* Add these directly below relevanceText */
  eligibilityBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#F3F4F6' },
  eligibilityHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  eligibilityTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  eligibilityText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  container: { padding: 24, paddingBottom: 40 },
  subtitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  description: { fontSize: 15, color: '#6B7280', lineHeight: 22, marginBottom: 32 },
  
  loadingContainer: { alignItems: 'center', marginTop: 40 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 15 },
  
  errorContainer: { alignItems: 'center', marginTop: 40, padding: 20, backgroundColor: '#FEF2F2', borderRadius: 16 },
  errorText: { color: '#EF4444', textAlign: 'center', marginTop: 12, fontSize: 16, marginBottom: 20 },
  retryButton: { backgroundColor: '#EF4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#ffffff', fontWeight: '700' },
  
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  cardTopRow: { marginBottom: 16, alignItems: 'flex-start' },
  levelBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  levelBadgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  schemeName: { flex: 1, fontSize: 19, fontWeight: '700', color: '#1F2937', lineHeight: 26 },
  relevanceText: { fontSize: 15, color: '#4B5563', lineHeight: 24, marginBottom: 24 },
  
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  actionButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' }
});