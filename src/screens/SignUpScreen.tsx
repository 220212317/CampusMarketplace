// src/screens/SignUpScreen.tsx
import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

export default function SignUpScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { signUp, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Community');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const roles = ['Community', 'Vendor'];

  // Auto-detect role based on email domain
  useEffect(() => {
    detectRoleFromEmail(email);
  }, [email]);

  const detectRoleFromEmail = (emailValue: string) => {
    if (!emailValue || !emailValue.includes('@')) {
      setShowRoleSelector(false);
      return;
    }

    const domain = emailValue.split('@')[1].toLowerCase();

    if (domain === 'mycput.ac.za') {
      setRole('Student');
      setShowRoleSelector(false);
    } else if (domain === 'cput.ac.za') {
      setRole('Staff member');
      setShowRoleSelector(false);
    } else {
      setShowRoleSelector(true);
      setRole('Community');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const commonPasswords = ['abcs1234', '12345678', '00000000', '01020304', 'hdyedvshj'];

  const passwordRequirements = [
    { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
    { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
    { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
    { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
    { test: (p: string) => /[@$!%*?&#^()_\-+=,.]/.test(p), label: 'One special character' },
  ];

  const validatePassword = (password: string) => {
    if (commonPasswords.includes(password.toLowerCase())) return false;
    return passwordRequirements.every(r => r.test(password));
  };

  const handleSignUp = async () => {
    // Validate email
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate password
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must include uppercase, lowercase, number, special character, and be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // For non-CPUT emails, require role selection
    const domain = email.split('@')[1].toLowerCase();
    if (domain !== 'mycput.ac.za' && domain !== 'cput.ac.za' && !role) {
      Alert.alert('Error', 'Please select your role');
      return;
    }

    // Validate terms
    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to the Terms & Conditions');
      return;
    }

    try {
      // Call signUp from AuthContext
      const signUpResult = await signUp(email, password, role);
      
      if (signUpResult && signUpResult.success) {
        // Show success alert
        Alert.alert(
          'Verification Code Sent',
          `We've sent a 6-digit verification code to ${email}. Please check your email and enter the code to verify your account.`,
          [
            {
              text: 'Enter Code',
              onPress: () => {
                // Navigate to EmailVerification screen
                navigation.navigate('EmailVerification', { 
                  email: email,
                  role: signUpResult.user.role,
                  userId: signUpResult.user.id,
                });
              }
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Sign up failed. Please try again.');
    }
  };

  const renderRoleButton = (roleName: string) => {
    const isSelected = role === roleName;
    return (
      <TouchableOpacity
        key={roleName}
        style={[
          styles.roleButton,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setRole(roleName)}
      >
        <Text
          style={[
            styles.roleText,
            { color: isSelected ? '#ffffff' : colors.text },
          ]}
        >
          {roleName}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={[styles.logoText, { color: colors.primary }]}>CM</Text>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              Join the Campus Network
            </Text>
            <Text style={[styles.domainText, { color: colors.textLight }]}>
              Connect and trade safely within university boundaries
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                Email Address <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textLight} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
                {email.length > 0 && (
                  <Ionicons 
                    name={validateEmail(email) ? 'checkmark-circle' : 'alert-circle'} 
                    size={20} 
                    color={validateEmail(email) ? colors.success : colors.error} 
                  />
                )}
              </View>
              {email.length > 0 && !validateEmail(email) && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Please enter a valid email address
                </Text>
              )}
            </View>

            {/* Role Selection (only shown for non-CPUT emails) */}
            {showRoleSelector && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Select Your Role <Text style={styles.required}>*</Text>
                </Text>
                <Text style={[styles.helperText, { color: colors.textLight }]}>
                  Choose how you want to participate in the campus community
                </Text>
                <View style={styles.roleContainer}>
                  {roles.map(renderRoleButton)}
                </View>
                {role === 'Vendor' && (
                  <Text style={[styles.roleDescription, { color: colors.textLight }]}>
                    💼 Vendors can sell products and services on the platform
                  </Text>
                )}
                {role === 'Community' && (
                  <Text style={[styles.roleDescription, { color: colors.textLight }]}>
                    👥 Community members can buy and participate in campus activities
                  </Text>
                )}
              </View>
            )}

            {/* Password */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password (min 8 characters)"
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
              {password.length > 0 && !validatePassword(password) && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Must include uppercase, lowercase, number, special character, and be at least 8 characters
                </Text>
              )}
              {validatePassword(password) && (
                <Text style={[styles.successText, { color: colors.success }]}>
                  ✓ Password is strong enough
                </Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                Confirm Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.card }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={colors.textLight} 
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Passwords do not match
                </Text>
              )}
              {confirmPassword.length > 0 && password === confirmPassword && (
                <Text style={[styles.successText, { color: colors.success }]}>
                  ✓ Passwords match
                </Text>
              )}
            </View>

            {/* Terms & Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              >
                <View style={[
                  styles.checkbox,
                  {
                    backgroundColor: agreeToTerms ? colors.primary : 'transparent',
                    borderColor: agreeToTerms ? colors.primary : colors.border,
                  }
                ]}>
                  {agreeToTerms && (
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  )}
                </View>
                <Text style={[styles.termsText, { color: colors.textLight }]}>
                  I agree to the{' '}
                  <Text style={[styles.termsLink, { color: colors.primary }]}>
                    Terms & Conditions
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[
                styles.signUpButton, 
                { 
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                }
              ]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.signUpButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.signInLink}
            >
              <Text style={[styles.signInText, { color: colors.textLight }]}>
                Already have an account?{' '}
                <Text style={[styles.signInLinkText, { color: colors.primary }]}>
                  Sign In
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  backButton: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
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
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#F44336',
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  successText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  roleDescription: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  termsContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
  },
  termsLink: {
    fontWeight: '600',
  },
  signUpButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 15,
  },
  signInLinkText: {
    fontWeight: '600',
  },
});