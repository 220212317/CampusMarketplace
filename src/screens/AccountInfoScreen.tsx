import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { storageAPI } from '../lib/api';
import * as ImagePicker from 'expo-image-picker';

export default function AccountInfoScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoVersion, setPhotoVersion] = useState(Date.now());
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [formData, setFormData] = useState({
    name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '',
    studentNumber: user?.studentNumber || '',
    bio: user?.bio || '',
    displayName: user?.displayName || '',
  });

  useEffect(() => {
    loadProfilePhoto();
  }, []);

  const loadProfilePhoto = async () => {
    if (!user?.id) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profile_photo_url')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error loading profile photo:', error);
      } else if (profile?.profile_photo_url) {
        console.log('✅ Loaded profile photo:', profile.profile_photo_url);
        setProfilePhoto(profile.profile_photo_url);
        setPhotoVersion(Date.now());
      }
    } catch (error) {
      console.error('Error loading profile photo:', error);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to select a photo.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('📸 Selected image:', asset);
        
        const file = {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `profile_${Date.now()}.jpg`,
        };
        
        await uploadProfilePhoto(file);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take a photo.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('📸 Captured photo:', asset);
        
        const file = {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `profile_${Date.now()}.jpg`,
        };
        
        await uploadProfilePhoto(file);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadProfilePhoto = async (file: any) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📤 Uploading file:', file);
      
      const result = await storageAPI.uploadProfilePhoto(user.id, file);
      console.log('✅ Upload result:', result);
      
      // Set the photo URL and force a cache-bust so the new image
      // doesn't get shadowed by a stale cached response for the same URL
      setProfilePhoto(result.url);
      setPhotoVersion(Date.now());
      
      // Update user context
      if (user) {
        user.profilePhoto = result.url;
      }
      
      // Force refresh the photo
      await loadProfilePhoto();
      
      Alert.alert('Success', 'Profile photo updated successfully!');
      setShowPhotoOptions(false);
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await storageAPI.deleteProfilePhoto(user?.id || '');
              setProfilePhoto(null);
              if (user) {
                user.profilePhoto = undefined;
              }
              Alert.alert('Success', 'Profile photo removed');
              setShowPhotoOptions(false);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove photo');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const nameParts = formData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          display_name: formData.displayName || `${firstName} ${lastName}`,
          phone_number: formData.phoneNumber,
          bio: formData.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Update user context
      if (user) {
        user.firstName = firstName;
        user.lastName = lastName;
        user.displayName = formData.displayName || `${firstName} ${lastName}`;
        user.phoneNumber = formData.phoneNumber;
        user.bio = formData.bio;
      }

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPhotoOptions = () => (
    <Modal
      visible={showPhotoOptions}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPhotoOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Change Profile Photo
          </Text>
          
          <TouchableOpacity
            style={[styles.modalOption, { borderBottomColor: colors.border }]}
            onPress={takePhoto}
          >
            <Ionicons name="camera-outline" size={24} color={colors.primary} />
            <Text style={[styles.modalOptionText, { color: colors.text }]}>
              Take Photo
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modalOption, { borderBottomColor: colors.border }]}
            onPress={pickImage}
          >
            <Ionicons name="images-outline" size={24} color={colors.primary} />
            <Text style={[styles.modalOptionText, { color: colors.text }]}>
              Choose from Gallery
            </Text>
          </TouchableOpacity>
          
          {profilePhoto && (
            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleRemovePhoto}
            >
              <Ionicons name="trash-outline" size={24} color={colors.error} />
              <Text style={[styles.modalOptionText, { color: colors.error }]}>
                Remove Photo
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.modalCancelButton, { borderColor: colors.border }]}
            onPress={() => setShowPhotoOptions(false)}
          >
            <Text style={[styles.modalCancelText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Account Information</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={[styles.editButton, { color: colors.primary }]}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.photoContainer}>
          <TouchableOpacity
            onPress={() => setShowPhotoOptions(true)}
            disabled={isLoading}
          >
            <View style={[styles.photoWrapper, { borderColor: colors.primary }]}>
              {profilePhoto ? (
                <Image
                  source={{
                    uri: `${profilePhoto}${profilePhoto.includes('?') ? '&' : '?'}v=${photoVersion}`,
                  }}
                  style={styles.photo}
                  onLoad={() => console.log('✅ Profile photo image loaded')}
                  onError={(e) => {
                    console.error('❌ Failed to load profile photo:', e.nativeEvent);
                    setProfilePhoto(null);
                  }}
                />
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.photoText}>
                    {formData.name.split(' ').map(n => n[0]).join('') || '?'}
                  </Text>
                </View>
              )}
              {isLoading && (
                <View style={styles.photoLoadingOverlay}>
                  <ActivityIndicator size="large" color="#ffffff" />
                </View>
              )}
              <View style={[styles.photoEditBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={16} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={[styles.photoHint, { color: colors.textLight }]}>
            Tap to change profile photo
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.textLight }]}>Name</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your name"
                placeholderTextColor={colors.textLight}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>
                {formData.name || 'Not provided'}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.textLight }]}>Display Name</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={formData.displayName}
                onChangeText={(text) => setFormData({ ...formData, displayName: text })}
                placeholder="How you want to be known"
                placeholderTextColor={colors.textLight}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>
                {formData.displayName || formData.name || 'Not provided'}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.textLight }]}>Student Number</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {formData.studentNumber || 'Not provided'}
            </Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.textLight }]}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>
                {formData.phoneNumber || 'Not provided'}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.textLight }]}>Email</Text>
            <Text style={[styles.value, { color: colors.text }]}>{formData.email}</Text>
            <Text style={[styles.helperText, { color: colors.textLight }]}>
              Email cannot be changed
            </Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.textLight }]}>Bio</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Tell us about yourself..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>
                {formData.bio || 'Not provided'}
              </Text>
            )}
          </View>

          {isEditing && (
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                }
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {renderPhotoOptions()}
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
    justifyContent: 'space-between',
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
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  photoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  photoWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  photo: {
    width: 114,
    height: 114,
    borderRadius: 57,
  },
  photoPlaceholder: {
    width: 114,
    height: 114,
    borderRadius: 57,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '700',
  },
  photoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  photoHint: {
    fontSize: 12,
    marginTop: 8,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalCancelButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});