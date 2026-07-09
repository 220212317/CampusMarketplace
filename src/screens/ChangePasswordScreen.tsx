// src/screens/ChangePasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export default function ChangePasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const commonPasswords = ['abcs1234', '12345678', '00000000', '01020304', 'hdyedvshj'];

  const getPasswordErrors = (password: string) => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('one number');
    if (!/[@$!%*?&#^()_\-+=,.]/.test(password)) errors.push('one special character');
    return errors;
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    const passwordErrors = getPasswordErrors(newPassword);
    if (passwordErrors.length > 0) {
      Alert.alert('Error', 'Password must include ' + passwordErrors.join(', '));
      return;
    }

    if (commonPasswords.includes(newPassword.toLowerCase())) {
      Alert.alert('Error', 'That password is too common. Please choose a stronger password.');
      return;
    }

    // In a real app, this would verify current password and update
    Alert.alert('Success', 'Password changed successfully');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.textLight }]}>Current Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={colors.textLight}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.textLight }]}>New Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={colors.textLight}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && getPasswordErrors(newPassword).length > 0 && (
              <Text style={[styles.errorText, { color: '#F44336' }]}>
                Must include uppercase, lowercase, number, special character, and be at least 8 characters
              </Text>
            )}
            {newPassword.length > 0 && getPasswordErrors(newPassword).length === 0 && !commonPasswords.includes(newPassword.toLowerCase()) && (
              <Text style={[styles.successText, { color: '#4CAF50' }]}>
                ✓ Password is strong enough
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.textLight }]}>Confirm Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textLight}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={[styles.errorText, { color: '#F44336' }]}>
                Passwords do not match
              </Text>
            )}
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <Text style={[styles.successText, { color: '#4CAF50' }]}>
                ✓ Passwords match
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.changeButton, { backgroundColor: colors.primary }]}
            onPress={handleChangePassword}
          >
            <Text style={styles.changeButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 16,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
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
  changeButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  changeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});