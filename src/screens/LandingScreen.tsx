// src/screens/LandingScreen.tsx (Supabase version)
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

// Design system tokens
const COLORS = {
  cream: '#fdf6f0',
  terracotta: '#c75c3e',
  terracottaSoft: 'rgba(199, 92, 62, 0.15)',
  terracottaSofter: 'rgba(199, 92, 62, 0.08)',
  textDark: '#2b2320',
  textMuted: '#6b5f59',
  white: '#ffffff',
};

export default function LandingScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // State for live stats
  const [stats, setStats] = useState({
    users: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch counts from Supabase
      const [usersResult, reviewsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        users: usersResult.count || 0,
        reviews: reviewsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set fallback values
      setStats({
        users: 0,
        reviews: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Format number with K suffix
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Define stats display items with real data
  const STATS_ITEMS = [
    { 
      value: formatNumber(stats.users), 
      label: 'Students',
      icon: 'people-outline',
    },
    { 
      value: formatNumber(stats.reviews), 
      label: 'Reviews',
      icon: 'star-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Header: CM logo + wordmark, Sign In pill */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoBoxText}>CM</Text>
            </View>
            <View>
              <Text style={styles.brandLine1}>COMMUNITY</Text>
              <Text style={styles.brandLine2}>MARKETPLACE</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signInPill}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in-outline" size={16} color={COLORS.textDark} />
            <Text style={styles.signInPillText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Hero: concentric circle with bag icon */}
        <Animated.View
          style={[
            styles.heroWrapper,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.circleOuter}>
            <View style={styles.circleInner}>
              <Ionicons name="bag-outline" size={72} color={COLORS.white} />
            </View>
          </View>
        </Animated.View>

        {/* Title + tagline */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>
            Simplifying Campus{'\n'}Commerce
          </Text>

          <Text style={styles.tagline}>
            The ultimate platform for staff and students to buy textbooks,
            resell electronics, find lost items, order delicious food, and
            announce university services safely.
          </Text>
        </Animated.View>

        {/* Stats bar with live data */}
        <Animated.View style={[styles.statsBar, { opacity: fadeAnim }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.terracotta} />
              <Text style={styles.loadingText}>Loading stats...</Text>
            </View>
          ) : (
            STATS_ITEMS.map((stat, index) => (
              <React.Fragment key={stat.label}>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name={stat.icon as any} size={20} color={COLORS.terracotta} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {index < STATS_ITEMS.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))
          )}
        </Animated.View>

        {/* Get Started Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.terracotta, COLORS.terracotta + 'DD']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueAsGuest}
            onPress={() => {
              navigation.navigate('Login');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.continueAsGuestText}>I Already Have an Account</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>
            By continuing, you agree to our
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>•</Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBoxText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },
  brandLine1: {
    color: COLORS.terracotta,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandLine2: {
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: -2,
  },
  signInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  signInPillText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '700',
  },
  heroWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  circleOuter: {
    width: width * 0.68,
    height: width * 0.68,
    borderRadius: (width * 0.68) / 2,
    backgroundColor: COLORS.terracottaSofter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInner: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    backgroundColor: COLORS.terracottaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.85,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 80,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.terracotta,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e8ddd5',
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  getStartedButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: COLORS.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  getStartedText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  continueAsGuest: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueAsGuestText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    opacity: 0.7,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  footerLink: {
    fontSize: 12,
    color: COLORS.terracotta,
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 12,
    color: COLORS.textMuted,
    opacity: 0.5,
  },
});