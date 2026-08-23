import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '@/types/types';
import { getAuth } from 'firebase/auth';


interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    userData: UserProfile;
    onSave: (updatedData: UserProfile) => void;
}

export default function EditProfileModal({ visible, onClose, userData, onSave }: EditProfileModalProps) {
    const [formData, setFormData] = useState<UserProfile>(userData);
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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

    // Update local state if the parent data changes
    useEffect(() => {
        if (visible) setFormData(userData);
    }, [visible, userData]);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API delay for a smooth UX
        setTimeout(() => {
            onSave(formData);
            setIsSaving(false);
            onClose();
        }, 600);
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            placeholder="e.g. Rahul Sharma"
                        />

                        <Text style={styles.label}>Business Name</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.businessCategory}
                            onChangeText={(text) => setFormData({ ...formData, businessCategory: text })}
                            placeholder="e.g. Rahul Lighting Co."
                        />

                        <Text style={styles.label}>Region / State</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.region}
                            onChangeText={(text) => setFormData({ ...formData, region: text })}
                            placeholder="e.g. Maharashtra"
                        />

                        {/* Usually Email is handled via Firebase Auth directly, so we make it read-only here, or you can allow edits if your backend supports it */}
                        <Text style={styles.label}>Email Address (Read-Only)</Text>
                        <TextInput
                            style={[styles.input, styles.readOnlyInput]}
                            value={email}
                            editable={false}
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                            <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    label: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 14, fontSize: 16, color: '#111827', marginBottom: 16 },
    readOnlyInput: { backgroundColor: '#F3F4F6', color: '#6B7280' },
    saveBtn: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 20 },
    saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' }
});