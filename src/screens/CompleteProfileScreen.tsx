// src/screens/CompleteProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { profileAPI } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function CompleteProfileScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { email, isNewUser, role, userId: paramUserId } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  
  // Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  
  // Student Specific
  const [studentNumber, setStudentNumber] = useState('');
  const [course, setCourse] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  
  // Staff Specific
  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  
  // Vendor Specific
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  
  // Community Specific
  const [communityType, setCommunityType] = useState('');

  // Prefer the role/userId passed from SignUp -> EmailVerification -> here,
  // since AuthContext deliberately doesn't set `user` until the account is
  // verified and signed in. Falling back to `user` covers the case where
  // this screen is reached after login instead (e.g. an incomplete profile).
  const userRole = role || user?.role || 'Student';
  const userId = paramUserId || user?.id;

  const isStudent = userRole === 'Student';
  const isStaff = userRole === 'Staff member';
  const isVendor = userRole === 'Vendor';
  const isCommunity = userRole === 'Community';

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\s/g, '');
    const phoneRegex = /^(\+27|0)[6-8][0-9]{8}$/;
    return phoneRegex.test(cleaned);
  };

  const handleComplete = async () => {
    if (!userId) {
      Alert.alert(
        'Something Went Wrong',
        'We lost track of your account during sign up. Please sign up again.',
        [{ text: 'OK', onPress: () => navigation.replace('SignUp') }]
      );
      return;
    }

    // Validate required fields
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }
    
    if (!lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return;
    }
    
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid South African phone number');
      return;
    }

    // Role-specific validation
    if (isStudent) {
      if (!studentNumber.trim()) {
        Alert.alert('Error', 'Please enter your student number');
        return;
      }
      if (!course.trim()) {
        Alert.alert('Error', 'Please enter your course');
        return;
      }
      if (!yearOfStudy.trim()) {
        Alert.alert('Error', 'Please enter your year of study');
        return;
      }
    }

    if (isStaff) {
      if (!staffId.trim()) {
        Alert.alert('Error', 'Please enter your staff ID');
        return;
      }
      if (!department.trim()) {
        Alert.alert('Error', 'Please enter your department');
        return;
      }
      if (!position.trim()) {
        Alert.alert('Error', 'Please enter your position');
        return;
      }
    }

    if (isVendor) {
      if (!businessName.trim()) {
        Alert.alert('Error', 'Please enter your business name');
        return;
      }
      if (!businessType.trim()) {
        Alert.alert('Error', 'Please enter your business type');
        return;
      }
      if (!businessDescription.trim()) {
        Alert.alert('Error', 'Please enter a business description');
        return;
      }
    }

    if (isCommunity) {
      if (!communityType.trim()) {
        Alert.alert('Error', 'Please enter your community type');
        return;
      }
    }

    setIsLoading(true);
    
    // Prepare profile data
    const profileData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: displayName.trim() || `${firstName.trim()} ${lastName.trim()}`,
      phoneNumber: phoneNumber.trim(),
      bio: bio.trim(),
      // Student fields
      studentNumber: studentNumber.trim(),
      course: course.trim(),
      yearOfStudy: yearOfStudy.trim(),
      // Staff fields
      staffId: staffId.trim(),
      department: department.trim(),
      position: position.trim(),
      // Vendor fields
      businessName: businessName.trim(),
      businessType: businessType.trim(),
      businessDescription: businessDescription.trim(),
      businessAddress: businessAddress.trim(),
      // Community fields
      communityType: communityType.trim(),
    };

    try {
      // ✅ Step 1: Save profile data
      const result = await profileAPI.updateProfile(userId, profileData);
      
      if (result.success) {
        // ✅ Step 2: Mark profile as completed
        const { error: flagError } = await supabase
          .from('profiles')
          .update({ 
            profile_completed: true, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', userId);

        if (flagError) {
          console.log('⚠️ Failed to set profile_completed flag:', flagError);
        }

        // ✅ Step 3: Show success alert
        Alert.alert(
          'Profile Complete!',
          'Your profile has been set up successfully. Please sign in to continue.',
          [
            {
              text: 'Sign In',
              onPress: () => {
                // ✅ Step 4: Navigate to Login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStudentFields = () => (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name="school-outline" size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Academic Information
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Student Number <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={studentNumber}
          onChangeText={setStudentNumber}
          placeholder="Enter your student number"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Course/Program <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={course}
          onChangeText={setCourse}
          placeholder="e.g. Computer Science, Engineering"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Year of Study <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={yearOfStudy}
          onChangeText={setYearOfStudy}
          placeholder="e.g. 1st Year, 2nd Year, 3rd Year"
          placeholderTextColor={colors.textLight}
        />
      </View>
    </>
  );

  const renderStaffFields = () => (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name="business-outline" size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Employment Information
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Staff ID <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={staffId}
          onChangeText={setStaffId}
          placeholder="Enter your staff ID"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Department <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={department}
          onChangeText={setDepartment}
          placeholder="e.g. Computer Science, Engineering"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Position <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={position}
          onChangeText={setPosition}
          placeholder="e.g. Lecturer, Professor, Administrator"
          placeholderTextColor={colors.textLight}
        />
      </View>
    </>
  );

  const renderVendorFields = () => (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name="storefront-outline" size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Business Information
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Business Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Enter your business name"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Business Type <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={businessType}
          onChangeText={setBusinessType}
          placeholder="e.g. Food, Electronics, Tutoring"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Business Registration Number <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={businessRegistrationNumber}
          onChangeText={setBusinessRegistrationNumber}
          placeholder="e.g. 2023/123456/08"
          placeholderTextColor={colors.textLight}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Business Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
          value={businessDescription}
          onChangeText={setBusinessDescription}
          placeholder="Describe your business, products, and services"
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Business Address
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={businessAddress}
          onChangeText={setBusinessAddress}
          placeholder="Enter your business address"
          placeholderTextColor={colors.textLight}
        />
      </View>
    </>
  );

  const renderCommunityFields = () => (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name="people-outline" size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Community Information
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          Community Type <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={communityType}
          onChangeText={setCommunityType}
          placeholder="e.g. Local Resident, Alumni, Parent"
          placeholderTextColor={colors.textLight}
        />
      </View>
    </>
  );

  const getUserRoleDisplay = () => {
    const roleMap: Record<string, string> = {
      'Student': 'Student',
      'Staff member': 'Staff',
      'Vendor': 'Vendor',
      'Community': 'Community Member'
    };
    return roleMap[userRole] || 'User';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Complete Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            Tell us more about yourself
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
              {getUserRoleDisplay()}
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>
              Ensure Accurate Credentials
            </Text>
            <Text style={[styles.infoText, { color: colors.textLight }]}>
              Your registered details are locked to your university domain profile to prevent peer-to-peer scams.
            </Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            <TouchableOpacity style={styles.photoWrapper}>
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={32} color="#ffffff" />
              </View>
              <Text style={[styles.photoText, { color: colors.textLight }]}>
                Add Profile Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Personal Information */}
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Personal Information
            </Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.rowItem, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                First Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="eg. Athi"
                placeholderTextColor={colors.textLight}
              />
            </View>
            <View style={[styles.rowItem, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>
                Last Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="eg. Sintiya"
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Display Name
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How you want to be known on the platform"
              placeholderTextColor={colors.textLight}
            />
            <Text style={[styles.helperText, { color: colors.textLight }]}>
              If left blank, your first name will be used
            </Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="eg. +27 78 829 0228"
              placeholderTextColor={colors.textLight}
              keyboardType="phone-pad"
            />
            {phoneNumber.length > 0 && !validatePhoneNumber(phoneNumber) && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                Please enter a valid South African phone number
              </Text>
            )}
            <Text style={[styles.helperText, { color: colors.textLight }]}>
              Format: +27 78 829 0228 or 078 829 0228
            </Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              Bio / About You
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us a bit about yourself..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Role-specific fields */}
          {isStudent && renderStudentFields()}
          {isStaff && renderStaffFields()}
          {isVendor && renderVendorFields()}
          {isCommunity && renderCommunityFields()}

          <TouchableOpacity
            style={[
              styles.completeButton, 
              { 
                backgroundColor: colors.primary,
                opacity: isLoading ? 0.7 : 1,
              }
            ]}
            onPress={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.completeButtonText}>Complete Profile</Text>
            )}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoWrapper: {
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoText: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
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
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 25,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 25,
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  completeButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});