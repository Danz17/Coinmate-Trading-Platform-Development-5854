import supabase from '../lib/supabase';

/**
 * Centralized service for Supabase database operations
 */
class SupabaseService {
  /**
   * Get user data from the database
   * @param {string} userId - The ID of the user to fetch
   * @returns {Promise<Object>} - The user data
   */
  async getUserData(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  /**
   * Get organization data from the database
   * @param {string} orgId - The ID of the organization to fetch
   * @returns {Promise<Object>} - The organization data
   */
  async getOrganizationData(orgId) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching organization data:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   * @returns {Promise<Object>} - The current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }
}

export default new SupabaseService();