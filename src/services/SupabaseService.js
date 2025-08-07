import supabase from '../lib/supabase';

class SupabaseServiceClass {
  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} userData - Additional user data
   * @returns {Promise<Object>} - New user data
   */
  async signUp(email, password, userData = {}) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData && authData.user) {
        // Create user profile in users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            name: userData.name || email.split('@')[0],
            role: userData.role || 'user',
            organization_id: userData.organization_id || null,
            created_at: new Date().toISOString(),
            ...userData
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }

        return { user: authData.user, profile: profileData };
      }

      return { user: authData.user };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  /**
   * Sign in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User data
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile data
      if (data && data.user) {
        const userData = await this.getUserData(data.user.id);
        return { ...data, profile: userData };
      }

      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get the current user
   * @returns {Promise<Object>} - Current user data
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (user) {
        const userData = await this.getUserData(user.id);
        return { ...user, ...userData };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get user data from the users table
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User data
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
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Update user data
   * @param {string} userId - User ID
   * @param {Object} updates - User data updates
   * @returns {Promise<Object>} - Updated user data
   */
  async updateUser(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role - Role to filter by
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of users
   */
  async getUsersByRole(role, organizationId) {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', role);
      
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  /**
   * Get all users for organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of users
   */
  async getOrganizationUsers(organizationId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting organization users:', error);
      return [];
    }
  }

  /**
   * Create a new organization
   * @param {Object} organizationData - Organization data
   * @returns {Promise<Object>} - New organization data
   */
  async createOrganization(organizationData) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          ...organizationData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Update an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} updates - Organization data updates
   * @returns {Promise<Object>} - Updated organization data
   */
  async updateOrganization(organizationId, updates) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Get organization data
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Organization data
   */
  async getOrganizationData(organizationId) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting organization data:', error);
      return null;
    }
  }

  /**
   * Get all organizations
   * @returns {Promise<Array>} - Array of organizations
   */
  async getAllOrganizations() {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting all organizations:', error);
      return [];
    }
  }

  /**
   * Get organizations for current user
   * @returns {Promise<Array>} - Array of organizations
   */
  async getUserOrganizations() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) return [];
      
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();
      
      if (userData.role === 'super_admin') {
        // Super admins can see all organizations
        return this.getAllOrganizations();
      }
      
      if (!userData.organization_id) return [];
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single();
      
      if (error) throw error;
      
      return data ? [data] : [];
    } catch (error) {
      console.error('Error getting user organizations:', error);
      return [];
    }
  }

  /**
   * Get white label settings for organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - White label settings
   */
  async getWhiteLabelSettings(organizationId) {
    try {
      const { data, error } = await supabase
        .from('white_label_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error, which is fine
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('Error getting white label settings:', error);
      return null;
    }
  }

  /**
   * Save white label settings for organization
   * @param {string} organizationId - Organization ID
   * @param {Object} settings - White label settings
   * @returns {Promise<Object>} - Updated settings
   */
  async saveWhiteLabelSettings(organizationId, settings) {
    try {
      // Check if settings already exist
      const existing = await this.getWhiteLabelSettings(organizationId);
      
      if (existing) {
        // Update existing settings
        const { data, error } = await supabase
          .from('white_label_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', organizationId)
          .select()
          .single();
        
        if (error) throw error;
        
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('white_label_settings')
          .insert({
            organization_id: organizationId,
            ...settings,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return data;
      }
    } catch (error) {
      console.error('Error saving white label settings:', error);
      throw error;
    }
  }

  /**
   * Get system settings for organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - System settings
   */
  async getSystemSettings(organizationId) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error, which is fine
        throw error;
      }
      
      return data?.settings || null;
    } catch (error) {
      console.error('Error getting system settings:', error);
      return null;
    }
  }

  /**
   * Save system settings for organization
   * @param {string} organizationId - Organization ID
   * @param {Object} settings - System settings
   * @returns {Promise<Object>} - Updated settings
   */
  async saveSystemSettings(organizationId, settings) {
    try {
      // Check if settings already exist
      const { data: existing, error: checkError } = await supabase
        .from('system_settings')
        .select('id')
        .eq('organization_id', organizationId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existing) {
        // Update existing settings
        const { data, error } = await supabase
          .from('system_settings')
          .update({
            settings,
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', organizationId)
          .select()
          .single();
        
        if (error) throw error;
        
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('system_settings')
          .insert({
            organization_id: organizationId,
            settings,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return data;
      }
    } catch (error) {
      console.error('Error saving system settings:', error);
      throw error;
    }
  }

  /**
   * Create system log
   * @param {Object} logData - Log data
   * @returns {Promise<Object>} - Created log
   */
  async createSystemLog(logData) {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .insert({
          ...logData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating system log:', error);
      return null;
    }
  }

  /**
   * Get system logs
   * @param {Object} filters - Log filters
   * @returns {Promise<Array>} - Array of logs
   */
  async getSystemLogs(filters = {}) {
    try {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }
      
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters.subtype) {
        query = query.eq('subtype', filters.subtype);
      }
      
      if (filters.user) {
        query = query.eq('user', filters.user);
      }
      
      if (filters.fromDate) {
        query = query.gte('created_at', filters.fromDate);
      }
      
      if (filters.toDate) {
        query = query.lte('created_at', filters.toDate);
      }
      
      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting system logs:', error);
      return [];
    }
  }

  /**
   * Create notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} - Created notification
   */
  async createNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notificationData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of notifications
   */
  async getUserNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Get new notifications since a specific time
   * @param {string} userId - User ID
   * @param {string} since - ISO timestamp
   * @returns {Promise<Array>} - Array of new notifications
   */
  async getNewNotifications(userId, since) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .gt('created_at', since)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting new notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Updated notification
   */
  async markNotificationAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async markAllNotificationsAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get exchange rates
   * @returns {Promise<Object>} - Exchange rates
   */
  async getExchangeRates() {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      
      return data?.rates || null;
    } catch (error) {
      console.error('Error getting exchange rates:', error);
      return null;
    }
  }

  /**
   * Get transactions
   * @param {Object} filters - Transaction filters
   * @returns {Promise<Array>} - Array of transactions
   */
  async getTransactions(filters = {}) {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          created_by:users!transactions_created_by_fkey(id, name),
          approved_by:users!transactions_approved_by_fkey(id, name)
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }
      
      if (filters.userId) {
        query = query.eq('created_by', filters.userId);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters.fromDate) {
        query = query.gte('created_at', filters.fromDate);
      }
      
      if (filters.toDate) {
        query = query.lte('created_at', filters.toDate);
      }
      
      if (filters.minAmount) {
        query = query.gte('amount', filters.minAmount);
      }
      
      if (filters.maxAmount) {
        query = query.lte('amount', filters.maxAmount);
      }
      
      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  /**
   * Create transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} - Created transaction
   */
  async createTransaction(transactionData) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transactionData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Update transaction
   * @param {string} transactionId - Transaction ID
   * @param {Object} updates - Transaction updates
   * @returns {Promise<Object>} - Updated transaction
   */
  async updateTransaction(transactionId, updates) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  /**
   * Approve transaction
   * @param {string} transactionId - Transaction ID
   * @param {string} approverId - Approver user ID
   * @param {string} notes - Approval notes
   * @returns {Promise<Object>} - Updated transaction
   */
  async approveTransaction(transactionId, approverId, notes = '') {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error approving transaction:', error);
      throw error;
    }
  }

  /**
   * Reject transaction
   * @param {string} transactionId - Transaction ID
   * @param {string} approverId - Approver user ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} - Updated transaction
   */
  async rejectTransaction(transactionId, approverId, reason = '') {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: 'rejected',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          notes: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction stats
   * @param {string} organizationId - Organization ID
   * @param {string} period - Period ('day', 'week', 'month', 'year')
   * @returns {Promise<Object>} - Transaction stats
   */
  async getTransactionStats(organizationId, period = 'week') {
    try {
      // Calculate start date based on period
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
      }
      
      // Get all transactions in the period
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Calculate stats
      const stats = {
        total: transactions.length,
        approved: transactions.filter(t => t.status === 'approved').length,
        rejected: transactions.filter(t => t.status === 'rejected').length,
        pending: transactions.filter(t => t.status === 'pending').length,
        totalAmount: transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
        approvedAmount: transactions
          .filter(t => t.status === 'approved')
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
        byType: {},
        byDay: {}
      };
      
      // Group by type
      transactions.forEach(transaction => {
        if (!stats.byType[transaction.type]) {
          stats.byType[transaction.type] = {
            count: 0,
            amount: 0
          };
        }
        
        stats.byType[transaction.type].count += 1;
        stats.byType[transaction.type].amount += parseFloat(transaction.amount) || 0;
        
        // Group by day
        const day = transaction.created_at.split('T')[0];
        if (!stats.byDay[day]) {
          stats.byDay[day] = {
            count: 0,
            amount: 0,
            approved: 0,
            rejected: 0,
            pending: 0
          };
        }
        
        stats.byDay[day].count += 1;
        stats.byDay[day].amount += parseFloat(transaction.amount) || 0;
        
        if (transaction.status === 'approved') {
          stats.byDay[day].approved += 1;
        } else if (transaction.status === 'rejected') {
          stats.byDay[day].rejected += 1;
        } else {
          stats.byDay[day].pending += 1;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      return null;
    }
  }
}

export const SupabaseService = new SupabaseServiceClass();