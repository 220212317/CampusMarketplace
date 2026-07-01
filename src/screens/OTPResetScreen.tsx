// src/screens/OTPResetScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { authAPI } from '../lib/api';

export default function OTPResetScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { email } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      if (nextIndex < 6 && inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authAPI.verifyOTP(email, otpCode);
      if (result.success) {
        Alert.alert(
          'Verification Successful',
          'You can now reset your password.',
          [
            {
              text: 'Reset Password',
              onPress: () => {
                navigation.replace('NewPassword', { email });
              }
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    try {
      await authAPI.resetPassword(email);
      setResendCountdown(30);
      setCanResend(false);
      Alert.alert('OTP Sent', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const setInputRef = (index: number) => (ref: TextInput | null) => {
    inputRefs.current[index] = ref;
  };

  const renderOtpInputs = () => {
    const inputs: React.ReactNode[] = [];
    for (let i = 0; i < 6; i++) {
      inputs.push(
        <TextInput
          key={i}
          ref={setInputRef(i)}
          style={[
            styles.otpInput,
            {
              backgroundColor: colors.card,
              borderColor: otp[i] ? colors.primary : colors.border,
              color: colors.text,
            },
          ]}
          value={otp[i]}
          onChangeText={(text) => handleOtpChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="numeric"
          maxLength={6}
          textAlign="center"
          selectionColor={colors.primary}
        />
      );
    }
    return inputs;
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

          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="mail" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Enter OTP</Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              Enter the 6-digit verification code sent to your email to reset your password
            </Text>
            <Text style={[styles.emailText, { color: colors.primary }]}>
              {email || 'your email address'}
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {renderOtpInputs()}
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              {
                backgroundColor: colors.primary,
                opacity: isLoading ? 0.7 : 1,
              },
            ]}
            onPress={handleVerifyOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify & Reset Password</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.textLight }]}>
              Didn't receive the code?
            </Text>
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={!canResend || isLoading}
            >
              <Text
                style={[
                  styles.resendLink,
                  {
                    color: canResend ? colors.primary : colors.textLight,
                    opacity: canResend ? 1 : 0.5,
                  },
                ]}
              >
                {canResend ? 'Resend Code' : `Resend in ${resendCountdown}s`}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.loginText, { color: colors.textLight }]}>
              Back to{' '}
              <Text style={[styles.loginLinkText, { color: colors.primary }]}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 20,
    fontWeight: '600',
    padding: 0,
    textAlign: 'center',
  },
  verifyButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 15,
  },
  loginLinkText: {
    fontWeight: '600',
  },
});