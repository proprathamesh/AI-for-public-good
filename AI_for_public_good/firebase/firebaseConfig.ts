import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, initializeAuth } from 'firebase/auth';

// @ts-expect-error: getReactNativePersistence exists at runtime but is missing from the standard TypeScript definitions
import { getReactNativePersistence } from 'firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyBVvfTkdy0gyJxsgr95mzlkqv-G2Skxqfg",
    authDomain: "ai-for-micro-entrepreneurs.firebaseapp.com",
    projectId: "ai-for-micro-entrepreneurs",
    storageBucket: "ai-for-micro-entrepreneurs.firebasestorage.app",
    messagingSenderId: "920128706751",
    appId: "1:920128706751:web:f50a7379d61c380eadce0a",
    measurementId: "G-2C5GW3HWXH"
};

// Ensure app is only initialized once
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;

try {
    // Attempt to initialize with React Native persistent storage
    const persistence = getReactNativePersistence(AsyncStorage);
    auth = initializeAuth(app, { persistence });
} catch (error) {
    // If hot-reloading causes auth to already be initialized, fallback to getAuth
    const { getAuth } = require('firebase/auth');
    auth = getAuth(app);
}

export { app, auth };
