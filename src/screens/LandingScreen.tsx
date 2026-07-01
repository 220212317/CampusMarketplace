// src/screens/LandingScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }: any) {
  const { colors } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const features = [
    {
      icon: 'book-outline',
      title: 'Buy & Sell Textbooks',
      description: 'Find affordable textbooks from fellow students',
    },
    {
      icon: 'phone-portrait-outline',
      title: 'Resell Electronics',
      description: 'Sell your used electronics to the campus community',
    },
    {
      icon: 'restaurant-outline',
      title: 'Order Food',
      description: 'Discover delicious food from campus vendors',
    },
    {
      icon: 'megaphone-outline',
      title: 'Campus Announcements',
      description: 'Stay updated with events and services on campus',
    },
    {
      icon: 'search-outline',
      title: 'Lost & Found',
      description: 'Report lost items or help others find theirs',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Animated Logo & Header */}
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>CM</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Campus Marketplace
          </Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            Simplifying Campus Commerce
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View 
          style={[
            styles.taglineContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={[styles.tagline, { color: colors.text }]}>
            The ultimate platform for staff and students to buy textbooks, resell electronics, find lost items, order delicious food, and announce university services safely.
          </Text>
        </Animated.View>

        {/* Features Grid */}
        <Animated.View 
          style={[
            styles.featuresContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            What You Can Do
          </Text>
          
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={[styles.featureCard, { backgroundColor: colors.card }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name={feature.icon as any} size={28} color={colors.primary} />
                </View>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textLight }]}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <TouchableOpacity
            style={[styles.signUpButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signUpButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signInButton, { borderColor: colors.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.signInButtonText, { color: colors.primary }]}>
              I Already Have an Account
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            By continuing, you agree to our
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Terms of Service
              </Text>
            </TouchableOpacity>
            <Text style={[styles.footerDot, { color: colors.textLight }]}>•</Text>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  taglineContainer: {
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  tagline: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.8,
  },
  featuresContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonContainer: {
    marginTop: 28,
    gap: 12,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  signInButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 12,
  },
});