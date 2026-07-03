// src/screens/ChatListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { chatAPI } from '../lib/api';

export default function ChatListScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadConversations();
    subscribeToUpdates();
    
    return () => {
      if (subscription) {
        chatAPI.unsubscribe(subscription);
      }
    };
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatAPI.getConversations(user?.id || '');
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    if (!user?.id) return;
    
    const channel = chatAPI.subscribeToConversations(user.id, (updated) => {
      setConversations(prev => {
        const index = prev.findIndex(c => c.id === updated.id);
        if (index !== -1) {
          const newList = [...prev];
          newList[index] = updated;
          return newList;
        }
        return [updated, ...prev];
      });
    });
    
    setSubscription(channel);
  };

  const getOtherUser = (conversation: any) => {
    const isBuyer = conversation.buyer_id === user?.id;
    return isBuyer ? conversation.seller : conversation.buyer;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString();
  };

  const renderConversation = ({ item }: { item: any }) => {
    const otherUser = getOtherUser(item);
    const isBuyer = item.buyer_id === user?.id;
    
    return (
      <TouchableOpacity
        style={[styles.conversationItem, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('ChatDetail', {
          conversationId: item.id,
          productId: item.product_id,
          otherUser: otherUser,
          product: item.product,
        })}
      >
        <View style={styles.avatarContainer}>
          {otherUser?.profile_photo_url ? (
            <Image
              source={{ uri: otherUser.profile_photo_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.name, { color: colors.text }]}>
              {otherUser?.first_name} {otherUser?.last_name}
            </Text>
            <Text style={[styles.time, { color: colors.textLight }]}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>
          
          <View style={styles.messageRow}>
            <Text style={[styles.lastMessage, { color: colors.textLight }]} numberOfLines={1}>
              {item.last_message || 'No messages yet'}
            </Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.roleBadge}>
                {isBuyer ? 'Buyer' : 'Seller'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </View>
          </View>
          
          <Text style={[styles.productTitle, { color: colors.textLight }]}>
            {item.product?.title || 'Product'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        {conversations.length === 0 && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Browse' })}
          >
            <Text style={[styles.startChat, { color: colors.primary }]}>Start Chat</Text>
          </TouchableOpacity>
        )}
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
            Start a conversation by messaging a seller about their product
          </Text>
          <TouchableOpacity
            style={[styles.browseButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Browse' })}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  startChat: {
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#c75c3e',
    backgroundColor: '#c75c3e15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  productTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  browseButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});