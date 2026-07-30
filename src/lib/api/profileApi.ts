import { supabase } from '../supabase';

export const profileAPI = {
  updateProfile: async (userId: string, profileData: any) => {
    try {
      console.log('📝 Updating profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          display_name: profileData.displayName,
          phone_number: profileData.phoneNumber,
          bio: profileData.bio,
          student_number: profileData.studentNumber,
          course: profileData.course,
          year_of_study: profileData.yearOfStudy,
          staff_id: profileData.staffId,
          department: profileData.department,
          position: profileData.position,
          business_name: profileData.businessName,
          business_type: profileData.businessType,
          business_description: profileData.businessDescription,
          business_address: profileData.businessAddress,
          community_type: profileData.communityType,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Profile update error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Profile updated successfully');
      return { success: true, user: data };
    } catch (error: any) {
      console.error('❌ Profile update failed:', error.message);
      throw error;
    }
  },

  getUserProfile: async (userId: string) => {
    try {
      console.log('🔍 Getting profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ Get profile error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Profile retrieved');
      return data;
    } catch (error: any) {
      console.error('❌ Get profile failed:', error.message);
      throw error;
    }
  },
};
