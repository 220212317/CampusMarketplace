// App.tsx
import React from 'react';
import { 
  NavigationContainer, 
  LinkingOptions 
} from '@react-navigation/native';
import { 
  View, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { useAuth } from './src/hooks/useAuth';
import { supabase } from './src/lib/supabase';
import { Linking } from 'react-native';
import { useTheme } from './src/hooks/useTheme';

// Define the navigation param list types
type RootParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  SignUp: undefined;
  ResetPassword: undefined;
  NewPassword: { email: string };
  EmailVerification: { email: string };
  CompleteProfile: { email: string; role: string; userId: string };
  Home: undefined;
  Browse: undefined;
  Cart: undefined;
  Profile: undefined;
  ProductDetail: { productId: string };
  Checkout: { total: number; product?: any; isSingleItem?: boolean };
};

// Deep linking configuration
const linking: LinkingOptions<RootParamList> = {
  prefixes: ['campusmarketplace://', 'https://campusmarketplace.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          SignUp: 'signup',
          ResetPassword: 'reset-password',
          NewPassword: 'new-password/:email',
          EmailVerification: 'verify-email/:email',
          CompleteProfile: 'complete-profile/:email/:role/:userId',
        },
      },
      Main: {
        screens: {
          Home: 'home',
          Browse: 'browse',
          Cart: 'cart',
          Profile: 'profile',
          ProductDetail: 'product/:productId',
          Checkout: 'checkout',
        },
      },
    },
  },
  async getInitialURL() {
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL();
    if (url) return url;
    
    // Check if there's a pending deep link from Supabase
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      // Handle the session if needed
      return null;
    }
    return null;
  },
  subscribe(listener: (url: string) => void) {
    // Listen for deep links
    const onReceiveURL = ({ url }: { url: string }) => {
      // Handle Supabase auth callback
      if (url.includes('auth/callback')) {
        // Parse the URL and handle auth callback
        const params = new URLSearchParams(url.split('?')[1]);
        const token = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (token && refreshToken) {
          // Set the session
          supabase.auth.setSession({
            access_token: token,
            refresh_token: refreshToken,
          });
        }
      }
      listener(url);
    };

    const subscription = Linking.addEventListener('url', onReceiveURL);
    return () => {
      subscription.remove();
    };
  },
};

// ✅ Loading Screen Component
const LoadingScreen = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

function RootNavigator() {
  const { user, isInitializing } = useAuth();
  
  // ✅ Show loading screen while checking for stored user
  if (isInitializing) {
    return <LoadingScreen />;
  }
  
  // ✅ User exists → MainApp, otherwise → Auth
  return user ? <MainNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <NavigationContainer linking={linking} fallback={null}>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});