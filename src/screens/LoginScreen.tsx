// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { signIn, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await signIn(username, password);
      
      // ✅ Step 1: Check if profile exists and is complete
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', username)
          .single();

        let currentProfile = profile;

        if (!currentProfile) {
          // ✅ Step 2: Create profile if it doesn't exist
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert([
                {
                  id: userData.user.id,
                  email: username,
                  role: 'Student',
                  is_verified: false,
                  profile_completed: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ])
              .select()
              .single();
            currentProfile = newProfile;
            console.log('✅ Profile created for existing user');
          }
        }

        // ✅ Step 3: Check if profile is completed
        if (!currentProfile || !currentProfile.profile_completed) {
          // ✅ Step 4: Navigate to CompleteProfile
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'CompleteProfile',
                params: {
                  email: username,
                  role: currentProfile?.role || 'Student',
                  userId: currentProfile?.id,
                },
              },
            ],
          });
          return;
        }
      } catch (profileError) {
        console.log('⚠️ Profile check error:', profileError);
      }

      // ✅ Step 5: Navigate to MainTabs (Main App)
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error: any) {
      // ✅ Step 6: Handle "Email not confirmed" error
      if (error.message && error.message.includes('Email not confirmed')) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email first. We can send you a new verification code.',
          [
            {
              text: 'Resend Code',
              onPress: () => {
                supabase.auth.resend({
                  type: 'signup',
                  email: username,
                });
                navigation.navigate('EmailVerification', { 
                  email: username,
                  isResend: true
                });
              }
            },
            {
              text: 'Try Again',
              style: 'cancel',
            }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Login failed');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={[styles.logoText, { color: colors.primary }]}>CM</Text>
            <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              Sign In to Your Account
            </Text>
            <Text style={[styles.domainText, { color: colors.textLight }]}>
              Connect and trade safely within university boundaries
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Username</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textLight} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your email address"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('ResetPassword')}
              style={styles.forgotButton}
            >
              <Text style={[styles.forgotText, { color: colors.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.signInButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              style={styles.signUpLink}
            >
              <Text style={[styles.signUpText, { color: colors.textLight }]}>
                Don't have an account?{' '}
                <Text style={[styles.signUpLinkText, { color: colors.primary }]}>
                  Sign Up
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 4,
  },
  domainText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 24,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
  },
  signUpLinkText: {
    fontWeight: '600',
  },
});