import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../../firebase/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function LoginScreen(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Add this line

  // State to track which input is currently focused for dynamic styling
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleAuthentication = async (): Promise<void> => {
    setErrorMessage(null); // Clear previous errors on new attempt

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        const token = await auth.currentUser?.getIdToken();
        console.log('New user created. Firebase token:', token);
        if (token) {
          await AsyncStorage.setItem('userToken', token); // Save it locally!
        }
        router.replace('/pages/Dashboard');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        const token = await auth.currentUser?.getIdToken();
        console.log('New user created. Firebase token:', token);
        if (token) {
          await AsyncStorage.setItem('userToken', token); // Save it locally!
        }
        router.replace('/pages/Onboarding');
      }
    } catch (error: any) {
      // Map Firebase errors to clean user-friendly text
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setErrorMessage('Invalid email or password.');
      } else if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered.');
      } else {
        setErrorMessage(error.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >

        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.iconPlaceholder}>
            <Text style={styles.iconText}>📦</Text>
          </View>
          <Text style={styles.appName}>Digital Co-Pilot</Text>
        </View>

        {/* Floating Login Card */}
        <View style={styles.card}>
          <Text style={styles.headerTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.headerSubtitle}>
            {isLogin ? 'Sign in to manage your inventory.' : 'Sign up to start logging your shipments.'}
          </Text>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TextInput
            style={[
              styles.input,
              focusedInput === 'email' && styles.inputFocused
            ]}
            placeholder="Email Address"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
          />

          <TextInput
            style={[
              styles.input,
              focusedInput === 'password' && styles.inputFocused
            ]}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuthentication}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
            style={styles.toggleButton}
            disabled={loading}
          >
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.toggleTextBold}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Minimal Footer / Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          disabled={loading}
        >
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Soft light gray background
  },
  errorBanner: {
    backgroundColor: '#FEE2E2', // Soft red
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  errorText: {
    color: '#B91C1C', // Dark red
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconPlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10, // For Android shadow
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827', // Dark slate
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#F9FAFB',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    fontSize: 16,
    color: '#1F2937',
  },
  inputFocused: {
    borderColor: '#4F46E5', // Indigo accent color when typing
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#4F46E5', // Vibrant Indigo
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#A5B4FC',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  toggleButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    color: '#6B7280',
    fontSize: 15,
  },
  toggleTextBold: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  backButton: {
    marginTop: 40,
    alignItems: 'center',
  },
  backText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  }
});