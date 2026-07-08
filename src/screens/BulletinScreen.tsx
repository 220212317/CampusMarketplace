// src/screens/BulletinScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { postAPI } from '../lib/api';
import { Post, PostType } from '../types';

const FILTER_TYPES: ('All' | PostType)[] = ['All', 'General', 'Event', 'Service', 'Lost & Found'];

const TYPE_STYLES: Record<PostType, { icon: keyof typeof Ionicons.glyphMap; bg: string; badgeBg: string }> = {
  General: { icon: 'chatbubble-outline', bg: '#F0F0F0', badgeBg: '#E8E8E8' },
  Event: { icon: 'calendar-outline', bg: '#E5F0FB', badgeBg: '#D6E9FA' },
  Service: { icon: 'briefcase-outline', bg: '#E3F6EC', badgeBg: '#D2F0E0' },
  'Lost & Found': { icon: 'search-outline', bg: '#FDECEA', badgeBg: '#FBDAD6' },
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  return `Posted on ${day}/${month}/${year}. ${time}`;
}

export default function BulletinScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | PostType>('All');

  const fetchPosts = useCallback(async () => {
    try {
      const data = await postAPI.getAll();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const filteredPosts =
    activeFilter === 'All' ? posts : posts.filter((p) => p.type === activeFilter);

  const renderFilterPill = (filter: 'All' | PostType) => {
    const isSelected = activeFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterPill,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setActiveFilter(filter)}
      >
        <Text style={[styles.filterText, { color: isSelected ? '#ffffff' : colors.text }]}>
          {filter}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPost = ({ item }: { item: Post }) => {
    const typeStyle = TYPE_STYLES[item.type];
    return (
      <View style={[styles.postCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.postHeaderRow}>
          <View style={[styles.badge, { backgroundColor: typeStyle.badgeBg }]}>
            <Ionicons name={typeStyle.icon} size={14} color={colors.text} />
            <Text style={[styles.badgeText, { color: colors.text }]}>{item.type}</Text>
          </View>
          <View style={styles.authorRow}>
            <Ionicons name="person-outline" size={14} color={colors.textLight} />
            <Text style={[styles.authorText, { color: colors.textLight }]}>
              {item.postedBy?.name || 'Anonymous'}
            </Text>
          </View>
        </View>

        <Text style={[styles.postTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.postDescription, { color: colors.textLight }]}>{item.description}</Text>

        {item.type === 'Service' && item.price && (
          <View style={[styles.infoBox, { backgroundColor: typeStyle.bg }]}>
            <Ionicons name="pricetag-outline" size={14} color={colors.text} />
            <Text style={[styles.infoText, { color: colors.text }]}>{item.price}</Text>
          </View>
        )}

        {item.type === 'Event' && (item.schedule || item.venue) && (
          <View style={[styles.infoBox, styles.infoBoxColumn, { backgroundColor: typeStyle.bg }]}>
            {item.schedule && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.text} />
                <Text style={[styles.infoText, { color: colors.text }]}>Schedule: {item.schedule}</Text>
              </View>
            )}
            {item.venue && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={14} color={colors.text} />
                <Text style={[styles.infoText, { color: colors.text }]}>Venue: {item.venue}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={[styles.postedDate, { color: colors.textLight }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={fetchPosts} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.createButtonText}>CREATE POST</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.primary }]}>Community Bulletin board</Text>
        <Text style={[styles.subtitle, { color: colors.textLight }]}>
          Daily announcements, lost and found, and activity..
        </Text>
      </View>

      <FlatList
        data={FILTER_TYPES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => renderFilterPill(item)}
        contentContainerStyle={styles.filterContainer}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textLight }]}>
              No posts yet. Be the first to post!
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 10,
  },
  refreshButton: { padding: 8 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 4,
  },
  createButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  titleContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
  filterContainer: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: { fontSize: 14, fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 30 },
  postCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  postHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorText: { fontSize: 13 },
  postTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  postDescription: { fontSize: 14, marginBottom: 10 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  infoBoxColumn: { flexDirection: 'column', alignItems: 'flex-start', gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13, fontWeight: '500' },
  postedDate: { fontSize: 11, textAlign: 'right' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});