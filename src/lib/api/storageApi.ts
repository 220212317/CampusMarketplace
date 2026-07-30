import { supabase } from '../supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeBase64 } from 'base64-arraybuffer';

const fileToArrayBuffer = async (fileUri: string) => {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decodeBase64(base64);
};

export const storageAPI = {
  uploadImage: async (filePath: string, file: any) => {
    try {
      console.log('📤 Uploading image:', filePath);
      
      const arrayBuffer = await fileToArrayBuffer(file.uri);
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, arrayBuffer, {
          contentType: file.type || 'image/jpeg',
        });
      
      if (error) {
        console.error('❌ Upload image error:', error);
        throw new Error(error.message);
      }
      
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      console.log('✅ Image uploaded:', urlData.publicUrl);
      return { url: urlData.publicUrl };
    } catch (error: any) {
      console.error('❌ Upload image failed:', error.message);
      throw error;
    }
  },

  
  uploadPostImage: async (filePath: string, file: any) => {
    try {
      console.log('📤 Uploading post image:', filePath);
      
      const arrayBuffer = await fileToArrayBuffer(file.uri);
      
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(filePath, arrayBuffer, {
          contentType: file.type || 'image/jpeg',
        });
      
      if (error) {
        console.error('❌ Upload post image error:', error);
        throw new Error(error.message);
      }
      
      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);
      
      console.log('✅ Post image uploaded:', urlData.publicUrl);
      return { url: urlData.publicUrl };
    } catch (error: any) {
      console.error('❌ Upload post image failed:', error.message);
      throw error;
    }
  },

  uploadProfilePhoto: async (userId: string, file: any) => {
    try {
      console.log('📤 Uploading profile photo for:', userId);
      console.log('📤 File data:', file);
      
      let fileExtension = 'jpg';
      if (file.uri) {
        const uriParts = file.uri.split('.');
        fileExtension = uriParts[uriParts.length - 1] || 'jpg';
      } else if (file.name) {
        const nameParts = file.name.split('.');
        fileExtension = nameParts[nameParts.length - 1] || 'jpg';
      }
      
      const filePath = `profiles/${userId}/photo.${fileExtension}`;
      
      console.log('📤 Uploading to path:', filePath);
      
      const arrayBuffer = await fileToArrayBuffer(file.uri);
      
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, arrayBuffer, {
          upsert: true,
          cacheControl: '3600',
          contentType: file.type || `image/${fileExtension}`,
        });
      
      if (error) {
        console.error('❌ Upload profile photo error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Upload successful, getting public URL...');
      
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);
      
      console.log('✅ Public URL:', urlData.publicUrl);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_photo_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('❌ Update profile error:', updateError);
        throw new Error(updateError.message);
      }
      
      const { data: verify } = await supabase
        .from('profiles')
        .select('profile_photo_url')
        .eq('id', userId)
        .single();
      
      console.log('✅ Verified profile photo URL in DB:', verify?.profile_photo_url);
      
      return { url: urlData.publicUrl };
    } catch (error: any) {
      console.error('❌ Upload profile photo failed:', error.message);
      throw error;
    }
  },

  deleteProfilePhoto: async (userId: string) => {
    try {
      console.log('🗑️ Deleting profile photo for:', userId);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('profile_photo_url')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.warn('⚠️ Profile not found:', profileError.message);
      }
      
      if (profile?.profile_photo_url) {
        const urlParts = profile.profile_photo_url.split('/');
        const filePath = urlParts.slice(urlParts.indexOf('profiles')).join('/');
        
        console.log('🗑️ Deleting file:', filePath);
        
        const { error: deleteError } = await supabase.storage
          .from('profile-photos')
          .remove([filePath]);
        
        if (deleteError) {
          console.error('❌ Delete profile photo error:', deleteError);
        }
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          profile_photo_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('❌ Update profile error:', updateError);
        throw new Error(updateError.message);
      }
      
      console.log('✅ Profile photo deleted');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Delete profile photo failed:', error.message);
      throw error;
    }
  },

  deleteImage: async (filePath: string) => {
    try {
      console.log('🗑️ Deleting image:', filePath);
      
      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath]);
      
      if (error) {
        console.error('❌ Delete image error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Image deleted');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Delete image failed:', error.message);
      throw error;
    }
  },
};
