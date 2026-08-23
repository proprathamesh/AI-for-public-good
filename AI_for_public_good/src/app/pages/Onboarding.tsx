import React, { useState } from 'react';
import { Alert } from 'react-native';
import { auth } from '../../../firebase/firebaseConfig'; 
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';

export default function OnboardingScreen(): React.ReactElement {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Form Data
  const [businessCategory, setBusinessCategory] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      try {
        // 1. Get the secure Firebase token for the logged-in user
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("No user is logged in.");

        // 2. Send the data to your Node server 
        const apiUrl = process.env.EXPO_PUBLIC_APP_URL;
        const response = await fetch(`${apiUrl}/api/users/onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Secure the request
          },
          body: JSON.stringify({ businessCategory, region, language })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("❌ Backend Error Details:", errorData);
          
          // Throw the specific backend error message if it exists, otherwise fallback
          throw new Error(errorData.error || "Failed to save profile");
        }

        // 3. Move to dashboard only on success
        console.log("Onboarding data saved to MongoDB!");
        router.replace('/pages/Dashboard');

      } catch (error: any) {
        console.error("Upload error:", error);
        Alert.alert("Connection Error", "Could not save your profile. Is the server running?");
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
            <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
        </View>

        <View style={styles.card}>
          {step === 1 && (
            <View>
              <Text style={styles.headerTitle}>What do you sell?</Text>
              <Text style={styles.headerSubtitle}>This helps the AI categorize your inventory automatically.</Text>
              <TextInput
                style={[styles.input, focusedInput === 'category' && styles.inputFocused]}
                placeholder="e.g., Decorative Lighting, Textiles..."
                placeholderTextColor="#9CA3AF"
                value={businessCategory}
                onChangeText={setBusinessCategory}
                onFocus={() => setFocusedInput('category')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.headerTitle}>Where are you located?</Text>
              <Text style={styles.headerSubtitle}>We use this to find relevant state-level government schemes.</Text>
              <TextInput
                style={[styles.input, focusedInput === 'region' && styles.inputFocused]}
                placeholder="e.g., Maharashtra, Uttar Pradesh..."
                placeholderTextColor="#9CA3AF"
                value={region}
                onChangeText={setRegion}
                onFocus={() => setFocusedInput('region')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.headerTitle}>Preferred Language</Text>
              <Text style={styles.headerSubtitle}>Choose how the AI should communicate with you.</Text>
              
              {['English', 'Hindi', 'Marathi'].map((lang) => (
                <TouchableOpacity 
                  key={lang}
                  style={[styles.languageOption, language === lang && styles.languageOptionSelected]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text style={[styles.languageText, language === lang && styles.languageTextSelected]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.buttonRow}>
            {step > 1 ? (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} /> 
            )}
            
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>{step === 3 ? 'Complete Setup' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32, gap: 8 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D1D5DB' },
  progressDotActive: { backgroundColor: '#4F46E5', width: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: '#6B7280', marginBottom: 24, lineHeight: 22 },
  input: { backgroundColor: '#F9FAFB', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#F3F4F6', fontSize: 16, color: '#1F2937' },
  inputFocused: { borderColor: '#4F46E5', backgroundColor: '#ffffff' },
  languageOption: { padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#F3F4F6', marginBottom: 12, alignItems: 'center' },
  languageOptionSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  languageText: { fontSize: 16, color: '#4B5563', fontWeight: '600' },
  languageTextSelected: { color: '#4F46E5', fontWeight: '800' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, gap: 16 },
  backButton: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { color: '#6B7280', fontSize: 16, fontWeight: 'bold' },
  nextButton: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  nextButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});