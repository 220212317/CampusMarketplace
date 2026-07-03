// src/components/AdminGuard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { adminAPI } from '../lib/api';
import { useTheme } from '../hooks/useTheme';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { isAdmin: admin } = await adminAPI.checkAdminStatus();
      setIsAdmin(admin);
      if (!admin) {
        Alert.alert(
          'Access Denied',
          'You do not have permission to access this page.',
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Admin check error:', error);
      setIsAdmin(false);
      Alert.alert(
        'Access Denied',
        'You do not have permission to access this page.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  if (isAdmin === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[styles.deniedContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.deniedText, { color: colors.text }]}>Access Denied</Text>
        <Text style={[styles.deniedSubtext, { color: colors.textLight }]}>
          You do not have permission to view this page.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deniedText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  deniedSubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
});