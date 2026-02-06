// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously, Auth, User } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhVx3wH-vLDi5rQZ8yN3xKmJ4tP9qW7eU",
  authDomain: "zomex-uix.firebaseapp.com",
  projectId: "zomex-uix",
  storageBucket: "zomex-uix.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
}

// Initialize Firebase (only once)
let app: FirebaseApp
let auth: Auth
let db: Firestore

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} else if (typeof window !== 'undefined') {
  app = getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
}

export { auth, db, signInAnonymously, doc, getDoc, setDoc }

// User settings interface
export interface UserSettings {
  projects: any[]
  themes: any[]
  customElements: any[]
  exportConfig: any
  lastModified: number
}

// Initialize default settings
export const defaultSettings: UserSettings = {
  projects: [],
  themes: [],
  customElements: [],
  exportConfig: {
    includeComments: true,
    minify: false,
    sprSettings: {
      dampingRatio: 0.8,
      undampedFrequency: 15
    },
    targetVersion: 'Luau',
    animationType: 'loop'
  },
  lastModified: Date.now()
}

// Auto-sign in anonymously and get user
export async function initializeFirebaseAuth(): Promise<User | null> {
  if (typeof window === 'undefined') return null
  
  try {
    // Check if already signed in
    if (auth.currentUser) {
      console.log('✅ Already signed in:', auth.currentUser.uid)
      return auth.currentUser
    }

    // Sign in anonymously
    const userCredential = await signInAnonymously(auth)
    console.log('✅ Signed in anonymously:', userCredential.user.uid)
    return userCredential.user
  } catch (error) {
    console.error('❌ Firebase Auth Error:', error)
    return null
  }
}

// Load user settings from Firestore
export async function loadSettings(uid: string): Promise<UserSettings> {
  try {
    const docRef = doc(db, 'users', uid)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      console.log('✅ Loaded settings from Firestore')
      return docSnap.data() as UserSettings
    } else {
      // No settings found, save defaults
      console.log('📝 No settings found, initializing defaults')
      await setDoc(docRef, defaultSettings)
      return defaultSettings
    }
  } catch (error) {
    console.error('❌ Error loading settings:', error)
    return defaultSettings
  }
}

// Save user settings to Firestore
export async function saveSettings(uid: string, settings: Partial<UserSettings>): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', uid)
    const updatedSettings = {
      ...settings,
      lastModified: Date.now()
    }
    await setDoc(docRef, updatedSettings, { merge: true })
    console.log('✅ Settings saved to Firestore')
    return true
  } catch (error) {
    console.error('❌ Error saving settings:', error)
    return false
  }
}

// Apply settings to the application
export function applySettings(settings: UserSettings): void {
  console.log('🎨 Applying settings:', {
    projects: settings.projects?.length || 0,
    themes: settings.themes?.length || 0,
    customElements: settings.customElements?.length || 0
  })
  
  // Settings are applied via React state in the main app
  // This function is just for logging/debugging
}
