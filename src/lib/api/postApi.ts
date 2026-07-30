import { supabase } from '../supabase';
import { Post, PostType } from '../../types';
 

export const postAPI = {
  getAll: async () => {
    try {
      console.log('📝 Getting all posts');
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          posted_by_profile:profiles(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Get posts error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Posts retrieved:', data?.length);
      
      return data?.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        category: item.category,
        price: item.price,
        schedule: item.schedule,
        venue: item.venue,
        images: item.images || [],
        postedBy: {
          id: item.posted_by_profile?.id,
          name: `${item.posted_by_profile?.first_name || ''} ${item.posted_by_profile?.last_name || ''}`.trim(),
          email: item.posted_by_profile?.email,
        },
        createdAt: item.created_at,
      })) || [];
    } catch (error: any) {
      console.error('❌ Get posts failed:', error.message);
      throw error;
    }
  },

  getByType: async (type: string) => {
    try {
      console.log('📝 Getting posts by type:', type);
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          posted_by_profile:profiles(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('type', type)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Get posts by type error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Posts retrieved by type:', data?.length);
      
      return data?.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        category: item.category,
        price: item.price,
        schedule: item.schedule,
        venue: item.venue,
        postedBy: {
          id: item.posted_by_profile?.id,
          name: `${item.posted_by_profile?.first_name || ''} ${item.posted_by_profile?.last_name || ''}`.trim(),
          email: item.posted_by_profile?.email,
        },
        createdAt: item.created_at,
      })) || [];
    } catch (error: any) {
      console.error('❌ Get posts by type failed:', error.message);
      throw error;
    }
  },

  create: async (postData: any) => {
    try {
      console.log('📝 Creating post:', postData.title);
      
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            type: postData.type,
            title: postData.title,
            description: postData.description,
            category: postData.category,
            price: postData.price,
            schedule: postData.schedule,
            venue: postData.venue,
            images: postData.images || [],
            posted_by: postData.postedBy.id,
          },
        ])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Create post error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Post created:', data.id);
      return data;
    } catch (error: any) {
      console.error('❌ Create post failed:', error.message);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      console.log('🗑️ Deleting post:', id);
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Delete post error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Post deleted');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Delete post failed:', error.message);
      throw error;
    }
  },
};
