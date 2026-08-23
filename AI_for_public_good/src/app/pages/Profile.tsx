import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EditProfileModal from '../../components/EditProfileModal';
import { UserProfile } from '@/types/types';
import { getAuth } from 'firebase/auth';

export default function ProfileScreen() {
    const router = useRouter();
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [profileData, setProfileData] = useState<UserProfile>({
        name: '',
        businessCategory: '',
        preferredLanguage: '',
        region: '',
    });

    const auth = getAuth();
    const user = auth.currentUser;

    // ✅ Wrap it in a useEffect so it only runs ONCE when the screen loads
    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            setEmail(user.email || '');
            console.log("Logged in as:", user.email);
        }
    }, []); // The empty brackets [] mean "only run this once"
    // 1. Fetch real data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const apiUrl = process.env.EXPO_PUBLIC_APP_URL;

                if (!token) {
                    router.replace('/pages/Login');
                    return;
                }

                const response = await fetch(`${apiUrl}/api/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const json = await response.json();

                if (json.success) {
                    setProfileData({
                        name: json.data.name || '',
                        businessCategory: json.data.businessName || '',
                        preferredLanguage: json.data.preferredLanguage || '',
                        region: json.data.region || '',
                    });
                }
            } catch (error) {
                Alert.alert("Error", "Could not load profile data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // 2. Save edits to the backend
    const handleSaveProfile = async (updatedData: UserProfile) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const apiUrl = process.env.EXPO_PUBLIC_APP_URL;

            const response = await fetch(`${apiUrl}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: updatedData.name,
                    businessName: updatedData.businessCategory,
                    region: updatedData.region
                })
            });

            const json = await response.json();

            if (json.success) {
                setProfileData(updatedData); // Update UI
                Alert.alert("Success", "Profile updated successfully!");
            } else {
                Alert.alert("Error", "Failed to update profile on server.");
            }
        } catch (error) {
            Alert.alert("Error", "Network connection failed.");
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem('userToken');
                        router.replace('/pages/Login');
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading Profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                <View style={styles.headerBackground}>
                    <View style={styles.topNav}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>Profile</Text>
                        <View style={{ width: 24 }} />
                    </View>
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={48} color="#4F46E5" />
                    </View>

                    <Text style={styles.profileName}>{profileData?.name || ''}</Text>
                    <Text style={styles.businessName}>{profileData?.businessCategory || ''}</Text>

                    <TouchableOpacity style={styles.editBadge} onPress={() => setEditModalVisible(true)}>
                        <Ionicons name="pencil" size={14} color="#ffffff" />
                        <Text style={styles.editBadgeText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.detailsContainer}>
                    <Text style={styles.sectionTitle}>Business Details</Text>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="mail" size={20} color="#4F46E5" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{email || 'Not provided'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="location" size={20} color="#4F46E5" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Region</Text>
                            <Text style={styles.infoValue}>{profileData?.region || 'Not set'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="business" size={20} color="#4F46E5" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Business Type</Text>
                            <Text style={styles.infoValue}>MSME / Retail</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionsContainer}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                        <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <EditProfileModal
                visible={isEditModalVisible}
                onClose={() => setEditModalVisible(false)}
                userData={profileData}
                onSave={handleSaveProfile}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContainer: { paddingBottom: 40 },
    headerBackground: { backgroundColor: '#4F46E5', height: 160, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, padding: 20 },
    topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    backButton: { padding: 4 },
    navTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
    profileCard: { backgroundColor: '#ffffff', marginHorizontal: 20, marginTop: -60, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
    avatarContainer: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 4, borderColor: '#ffffff' },
    profileName: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
    businessName: { fontSize: 15, color: '#6B7280', marginBottom: 16, textAlign: 'center' },
    editBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
    editBadgeText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
    detailsContainer: { marginTop: 24, marginHorizontal: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    infoTextContainer: { flex: 1 },
    infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
    actionsContainer: { marginTop: 24, marginHorizontal: 20 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    actionBtnText: { fontSize: 15, fontWeight: '600', color: '#4B5563', marginLeft: 16, flex: 1 },
    logoutBtn: { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }
});