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
    
    const url = await Linking.getInitialURL();
    if (url) return url;
    
    
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
    
      return null;
    }
    return null;
  },
  subscribe(listener: (url: string) => void) {
    
    const onReceiveURL = ({ url }: { url: string }) => {
     
      if (url.includes('auth/callback')) {
       
        const params = new URLSearchParams(url.split('?')[1]);
        const token = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (token && refreshToken) {
         
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
  
  
  if (isInitializing) {
    return <LoadingScreen />;
  }
  
  
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