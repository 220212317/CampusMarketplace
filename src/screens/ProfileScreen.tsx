// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { adminAPI } from '../lib/api';

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadProfilePhoto();
    checkAdminStatus();
  }, [user]);

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
        console.log('✅ Loaded profile photo URL:', profile.profile_photo_url);
        const separator = profile.profile_photo_url.includes('?') ? '&' : '?';
        setProfilePhoto(`${profile.profile_photo_url}${separator}t=${Date.now()}`);
        setImageError(false);
        setImageLoading(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { isAdmin: admin } = await adminAPI.checkAdminStatus();
      setIsAdmin(admin);
      console.log('👑 Admin status:', admin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const getInitials = () => {
    const first = user?.firstName?.[0] || 'A';
    const last = user?.lastName?.[0] || 'S';
    return (first + last).toUpperCase();
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Account Information',
      onPress: () => navigation.navigate('AccountInfo'),
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Messages',
      onPress: () => navigation.navigate('ChatList'),
    },
    {
      icon: 'location-outline',
      title: 'Address',
      onPress: () => Alert.alert('Coming Soon', 'Address management will be available soon'),
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      onPress: () => Alert.alert('Coming Soon', 'Payment methods will be available soon'),
    },
    {
      icon: 'shield-outline',
      title: 'Security',
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help Center',
      onPress: () => Alert.alert('Coming Soon', 'Help center will be available soon'),
    },
  ];

  // Add admin menu item if user is admin
  if (isAdmin) {
    menuItems.push({
      icon: 'shield-checkmark-outline',
      title: 'Admin Panel',
      onPress: () => navigation.navigate('AdminUsers'),
    });
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowSignOutModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              {profilePhoto && !imageError ? (
                <>
                  <Image 
                    source={{ 
                      uri: profilePhoto,
                      headers: {
                        'Cache-Control': 'no-cache',
                      }
                    }} 
                    style={styles.avatarImage}
                    onLoadStart={() => {
                      console.log('🔄 Image loading started');
                      setImageLoading(true);
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully');
                      setImageLoading(false);
                      setImageError(false);
                    }}
                    onError={(e) => {
                      console.error('❌ Failed to load profile photo:', e.nativeEvent);
                      setImageError(true);
                      setImageLoading(false);
                    }}
                  />
                  {imageLoading && (
                    <View style={styles.imageLoadingOverlay}>
                      <ActivityIndicator size="small" color="#ffffff" />
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.avatarText}>
                  {getInitials()}
                </Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.firstName || 'Athi'} {user?.lastName || 'Sintiya'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textLight }]}>
                {user?.email || 'lifezekiseathi@gmail.com'}
              </Text>
              <View style={styles.badgeRow}>
                <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.roleBadgeText}>{user?.role || 'Admin'}</Text>
                </View>
                {isAdmin && (
                  <View style={[styles.adminBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="shield-checkmark" size={12} color="#ffffff" />
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color={colors.primary} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  {item.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.error }]}
          onPress={() => setShowSignOutModal(true)}
        >
          <Ionicons name="log-out-outline" size={20} color="#ffffff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Modal
          visible={showSignOutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSignOutModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Are you sure you want to sign out?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonNo, { borderColor: colors.border }]}
                  onPress={() => setShowSignOutModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>NO</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonYes, { backgroundColor: colors.error }]}
                  onPress={handleSignOut}
                >
                  <Text style={styles.modalButtonText}>YES</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  menuContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 20,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalButtonNo: {
    borderWidth: 1,
  },
  modalButtonYes: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});