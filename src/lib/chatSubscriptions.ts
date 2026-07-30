import { supabase } from './supabase';

class ChatSubscriptionManager {
  private channels: Map<string, any> = new Map();

  subscribeToMessages(conversationId: string, onMessage: (message: any) => void) {
    const channelName = `messages:${conversationId}`;
    
    
    this.unsubscribe(channelName);
    
    console.log('📡 Setting up message subscription for conversation:', conversationId);
    
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: '' },
      },
    });
    
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('📩 New message received:', payload.new);
          onMessage(payload.new);
        }
      );
    
    
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Message subscription active for:', conversationId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Message subscription error:', err);
      } else {
        console.log('📡 Message subscription status:', status);
      }
    });
    
    this.channels.set(channelName, channel);
    return channel;
  }

  subscribeToConversations(userId: string, onUpdate: (conversation: any) => void) {
    const channelName = `conversations:${userId}`;
    
    
    this.unsubscribe(channelName);
    
    console.log('📡 Setting up conversation subscription for user:', userId);
    
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: '' },
      },
    });
    
    
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `buyer_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📩 Conversation updated (buyer):', payload.new);
          onUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `seller_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📩 Conversation updated (seller):', payload.new);
          onUpdate(payload.new);
        }
      );
    
    
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Conversation subscription active for:', userId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Conversation subscription error:', err);
      } else {
        console.log('📡 Conversation subscription status:', status);
      }
    });
    
    this.channels.set(channelName, channel);
    return channel;
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      console.log('📡 Unsubscribing from channel:', channelName);
      try {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('⚠️ Error unsubscribing:', error);
      }
      this.channels.delete(channelName);
    }
  }

  unsubscribeAll() {
    console.log('📡 Unsubscribing from all channels');
    for (const [name, channel] of this.channels) {
      try {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('⚠️ Error unsubscribing from', name, ':', error);
      }
    }
    this.channels.clear();
  }

  getChannel(channelName: string) {
    return this.channels.get(channelName);
  }

  hasChannel(channelName: string) {
    return this.channels.has(channelName);
  }
}

export const chatSubscriptionManager = new ChatSubscriptionManager();