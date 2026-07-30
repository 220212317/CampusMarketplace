import { supabase } from '../supabase';

export const chatAPI = {
  getOrCreateConversation: async (productId: string, buyerId: string, sellerId: string) => {
    try {
      console.log('💬 Getting or creating conversation for product:', productId);
      
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('product_id', productId)
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .maybeSingle();     
      
      if (findError) {      
        throw new Error(findError.message);
      }
      
      if (existing) {
        return existing;
      }
      
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            product_id: productId,
            buyer_id: buyerId,
            seller_id: sellerId,
          },
        ])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      console.log('✅ Conversation created:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Get/create conversation error:', error.message);
      throw error;
    }
  },

  getConversations: async (userId: string) => {
    try {
      console.log('💬 Getting conversations for user:', userId);
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          product:products(
            id,
            title,
            price,
            images
          ),
          buyer:profiles!buyer_id(
            id,
            first_name,
            last_name,
            profile_photo_url
          ),
          seller:profiles!seller_id(
            id,
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('updated_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      
      console.log('✅ Conversations retrieved:', data?.length);
      return data;
    } catch (error: any) {
      console.error('❌ Get conversations error:', error.message);
      throw error;
    }
  },

  getMessages: async (conversationId: string) => {
    try {
      console.log('💬 Getting messages for conversation:', conversationId);
      
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', userData.user.id);
      }
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw new Error(error.message);
      
      console.log('✅ Messages retrieved:', data?.length);
      return data;
    } catch (error: any) {
      console.error('❌ Get messages error:', error.message);
      throw error;
    }
  },

  sendMessage: async (conversationId: string, senderId: string, content: string) => {
    try {
      console.log('💬 Sending message to conversation:', conversationId);
      
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: senderId,
            content: content,
          },
        ])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      await supabase
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString(),
          last_message: content,
          last_message_at: new Date().toISOString(),
          last_message_sender_id: senderId,
          last_message_is_read: false,
        })
        .eq('id', conversationId);
      
      console.log('✅ Message sent:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Send message error:', error.message);
      throw error;
    }
  },

  markAsRead: async (conversationId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);
      
      if (error) throw new Error(error.message);

      await supabase
        .from('conversations')
        .update({ last_message_is_read: true })
        .eq('id', conversationId)
        .not('last_message_sender_id', 'eq', userId);
      
      console.log('✅ Messages marked as read');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Mark as read error:', error.message);
      throw error;
    }
  },

  subscribeToMessages: (conversationId: string, onMessage: (message: any) => void) => {
    console.log('📡 Setting up message subscription for conversation:', conversationId);
    
    const channelName = `messages:${conversationId}`;
    
    const existingChannel = supabase.channel(channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }
    
    const channel = supabase
      .channel(channelName)
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
    
    channel.subscribe((status) => {
      console.log('📡 Message subscription status for', conversationId, ':', status);
    });
    
    return channel;
  },

  subscribeToConversations: (userId: string, onUpdate: (conversation: any) => void) => {
    console.log('📡 Setting up conversation subscription for user:', userId);
    
    const channelName = `conversations:${userId}`;
    
    const existingChannel = supabase.channel(channelName);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }
    
    const channel = supabase
      .channel(channelName)
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
    
    channel.subscribe((status) => {
      console.log('📡 Conversation subscription status for', userId, ':', status);
    });
    
    return channel;
  },

  unsubscribe: (channel: any) => {
    if (channel) {
      console.log('📡 Unsubscribing from channel:', channel.topic);
      supabase.removeChannel(channel);
    }
  },
};
