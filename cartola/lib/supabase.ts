import { createClient } from '@supabase/supabase-js';  
import { Platform } from 'react-native';  
  
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;  
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;  
  
if (!supabaseUrl || !supabaseAnonKey) {  
  throw new Error('Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');  
}  
  
const isBrowser = typeof window !== 'undefined';  
const isWeb = Platform.OS === 'web';  
  
const webStorage = {  
  getItem(key: string) { return Promise.resolve(window.localStorage.getItem(key)); },  
  setItem(key: string, value: string) { window.localStorage.setItem(key, value); return Promise.resolve(); },  
  removeItem(key: string) { window.localStorage.removeItem(key); return Promise.resolve(); },  
};  
  
const memoryStorage = {  
  getItem(_key: string) { return Promise.resolve(null); },  
  setItem(_key: string, _value: string) { return Promise.resolve(); },  
  removeItem(_key: string) { return Promise.resolve(); },  
};  
  
let storage: any = memoryStorage;  
if (isWeb) {  
  storage = isBrowser ? webStorage : memoryStorage;  
} else {  
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;  
  storage = AsyncStorage;  
}  
  
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {  
  auth: {  
    storage,  
    persistSession: true,  
    autoRefreshToken: true,  
    detectSessionInUrl: isWeb && isBrowser,  
  },  
}); 
