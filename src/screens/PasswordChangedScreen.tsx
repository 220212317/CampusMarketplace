// src/screens/PasswordChangedScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export default function PasswordChangedScreen({ navigation }: any) {
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={48} color="#ffffff" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Password changed successfully</Text>
        <Text style={[styles.subtitle, { color: colors.textLight }]}>
          You will be redirected to Sign In page in 3 seconds...
        </Text>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  loginButton: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 25 },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});