import supabase from '../lib/supabase';

class SupabaseServiceClass {
  constructor() {
    this.tableSuffix = '_ft2024';
  }

  // Users
  async getUsers() {
    const { data, error } = await supabase
      .from(`users${this.tableSuffix}`)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createUser(userData) {
    const { data, error } = await supabase
      .from(`users${this.tableSuffix}`)
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from(`users${this.tableSuffix}`)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteUser(userId) {
    const { error } = await supabase
      .from(`users${this.tableSuffix}`)
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  }

  // Transactions
  async getTransactions() {
    const { data, error } = await supabase
      .from(`transactions${this.tableSuffix}`)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createTransaction(transactionData) {
    const { data, error } = await supabase
      .from(`transactions${this.tableSuffix}`)
      .insert(transactionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateTransaction(transactionId, updates) {
    const { data, error } = await supabase
      .from(`transactions${this.tableSuffix}`)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', transactionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteTransaction(transactionId) {
    const { error } = await supabase
      .from(`transactions${this.tableSuffix}`)
      .delete()
      .eq('id', transactionId);
    
    if (error) throw error;
  }

  // Platforms
  async getPlatforms() {
    const { data, error } = await supabase
      .from(`platforms${this.tableSuffix}`)
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async createPlatform(name, usdtBalance = 0) {
    const { data, error } = await supabase
      .from(`platforms${this.tableSuffix}`)
      .insert({ name, usdt_balance: usdtBalance })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updatePlatformBalance(platformName, newBalance) {
    const { data, error } = await supabase
      .from(`platforms${this.tableSuffix}`)
      .update({ usdt_balance: newBalance })
      .eq('name', platformName)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async deletePlatform(platformName) {
    const { error } = await supabase
      .from(`platforms${this.tableSuffix}`)
      .delete()
      .eq('name', platformName);
    
    if (error) throw error;
  }

  // Banks
  async getBanks() {
    const { data, error } = await supabase
      .from(`banks${this.tableSuffix}`)
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async createBank(name) {
    const { data, error } = await supabase
      .from(`banks${this.tableSuffix}`)
      .insert({ name })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async deleteBank(bankName) {
    const { error } = await supabase
      .from(`banks${this.tableSuffix}`)
      .delete()
      .eq('name', bankName);
    
    if (error) throw error;
  }

  // System Settings
  async getSystemSettings() {
    const { data, error } = await supabase
      .from(`system_settings${this.tableSuffix}`)
      .select('*')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateSystemSettings(settings) {
    const { data, error } = await supabase
      .from(`system_settings${this.tableSuffix}`)
      .upsert({ ...settings, updated_at: new Date().toISOString() })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // System Logs
  async createSystemLog(logData) {
    const { data, error } = await supabase
      .from(`system_logs${this.tableSuffix}`)
      .insert(logData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getSystemLogs(limit = 100) {
    const { data, error } = await supabase
      .from(`system_logs${this.tableSuffix}`)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  // HR Logs
  async createHRLog(logData) {
    const { data, error } = await supabase
      .from(`hr_logs${this.tableSuffix}`)
      .insert(logData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateHRLog(logId, updates) {
    const { data, error } = await supabase
      .from(`hr_logs${this.tableSuffix}`)
      .update(updates)
      .eq('id', logId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getHRLogs() {
    const { data, error } = await supabase
      .from(`hr_logs${this.tableSuffix}`)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Dashboard Layouts
  async getUserDashboardLayout(userId) {
    const { data, error } = await supabase
      .from(`user_dashboard_layouts${this.tableSuffix}`)
      .select('layouts')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data?.layouts;
  }

  async saveUserDashboardLayout(userId, layouts) {
    const { data, error } = await supabase
      .from(`user_dashboard_layouts${this.tableSuffix}`)
      .upsert(
        { user_id: userId, layouts, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Trade Memory
  async getUserTradeMemory(userId) {
    const { data, error } = await supabase
      .from(`user_trade_memory${this.tableSuffix}`)
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString());
    
    if (error) throw error;
    return data || [];
  }

  async saveUserTradeMemory(userId, transactionType, selectedUser, userBank) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const { data, error } = await supabase
      .from(`user_trade_memory${this.tableSuffix}`)
      .upsert(
        {
          user_id: userId,
          transaction_type: transactionType,
          selected_user: selectedUser,
          user_bank: userBank,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,transaction_type' }
      )
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Organizations
  async getOrganizations() {
    const { data, error } = await supabase
      .from(`organizations${this.tableSuffix}`)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createOrganization(organizationData) {
    const { data, error } = await supabase
      .from(`organizations${this.tableSuffix}`)
      .insert(organizationData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateOrganization(organizationId, updates) {
    const { data, error } = await supabase
      .from(`organizations${this.tableSuffix}`)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', organizationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteOrganization(organizationId) {
    const { error } = await supabase
      .from(`organizations${this.tableSuffix}`)
      .delete()
      .eq('id', organizationId);
    
    if (error) throw error;
  }

  async setDefaultOrganization(organizationId) {
    // First, clear default flag from all organizations
    const { error: clearError } = await supabase
      .from(`organizations${this.tableSuffix}`)
      .update({ is_default: false })
      .neq('id', 'none'); // Update all rows
    
    if (clearError) throw clearError;
    
    // Then set the new default
    const { data, error } = await supabase
      .from(`organizations${this.tableSuffix}`)
      .update({ is_default: true })
      .eq('id', organizationId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async addOrganizationAdmin(organizationId, userId) {
    const { data, error } = await supabase
      .from(`organization_admins${this.tableSuffix}`)
      .insert({ organization_id: organizationId, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async removeOrganizationAdmin(organizationId, userId) {
    const { error } = await supabase
      .from(`organization_admins${this.tableSuffix}`)
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  async getOrganizationAdmins(organizationId) {
    const { data, error } = await supabase
      .from(`organization_admins${this.tableSuffix}`)
      .select(`
        user_id,
        users${this.tableSuffix}!inner (id, name, email, role)
      `)
      .eq('organization_id', organizationId);
    
    if (error) throw error;
    return data?.map(item => item.users) || [];
  }

  async getUserOrganizations(userId) {
    const { data, error } = await supabase
      .from(`organization_admins${this.tableSuffix}`)
      .select(`
        organization_id,
        organizations${this.tableSuffix}!inner (id, name, display_name)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data?.map(item => item.organizations) || [];
  }
}

export const SupabaseService = new SupabaseServiceClass();