import { SupabaseService } from './SupabaseService';

class OrganizationManagerClass {
  constructor() {
    this.organizations = [];
    this.currentOrganization = null;
    this.whiteLabelSettings = null;
    this.isInitialized = false;
  }

  /**
   * Initialize organization manager
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Load organizations
      await this.loadOrganizations();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing organization manager:', error);
      return false;
    }
  }

  /**
   * Load organizations from database
   */
  async loadOrganizations() {
    try {
      this.organizations = await SupabaseService.getUserOrganizations();
      
      // Set current organization to the first one if available
      if (this.organizations.length > 0 && !this.currentOrganization) {
        this.currentOrganization = this.organizations[0];
        
        // Load white label settings for current organization
        await this.loadWhiteLabelSettings(this.currentOrganization.id);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      this.organizations = [];
    }
  }

  /**
   * Get all organizations
   * @returns {Array} - Array of organizations
   */
  getOrganizations() {
    return [...this.organizations];
  }

  /**
   * Get organization by ID
   * @param {string} id - Organization ID
   * @returns {Object|null} - Organization data
   */
  getOrganization(id) {
    return this.organizations.find(org => org.id === id) || null;
  }

  /**
   * Get current organization
   * @returns {Object|null} - Current organization
   */
  getCurrentOrganization() {
    return this.currentOrganization;
  }

  /**
   * Set current organization
   * @param {Object} organization - Organization data
   */
  setCurrentOrganization(organization) {
    this.currentOrganization = organization;
  }

  /**
   * Create new organization
   * @param {Object} organizationData - Organization data
   * @returns {Promise<Object>} - New organization data
   */
  async createOrganization(organizationData) {
    try {
      const newOrganization = await SupabaseService.createOrganization(organizationData);
      
      if (newOrganization) {
        this.organizations.push(newOrganization);
      }
      
      return newOrganization;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Update organization
   * @param {string} id - Organization ID
   * @param {Object} updates - Organization updates
   * @returns {Promise<Object>} - Updated organization
   */
  async updateOrganization(id, updates) {
    try {
      const updatedOrganization = await SupabaseService.updateOrganization(id, updates);
      
      if (updatedOrganization) {
        // Update in local cache
        const index = this.organizations.findIndex(org => org.id === id);
        if (index !== -1) {
          this.organizations[index] = updatedOrganization;
        }
        
        // Update current organization if needed
        if (this.currentOrganization && this.currentOrganization.id === id) {
          this.currentOrganization = updatedOrganization;
        }
      }
      
      return updatedOrganization;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Load white label settings for organization
   * @param {string} organizationId - Organization ID
   */
  async loadWhiteLabelSettings(organizationId) {
    try {
      this.whiteLabelSettings = await SupabaseService.getWhiteLabelSettings(organizationId);
    } catch (error) {
      console.error('Error loading white label settings:', error);
      this.whiteLabelSettings = null;
    }
  }

  /**
   * Get white label settings
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object|null>} - White label settings
   */
  async getWhiteLabelSettings(organizationId) {
    try {
      return await SupabaseService.getWhiteLabelSettings(organizationId);
    } catch (error) {
      console.error('Error getting white label settings:', error);
      return null;
    }
  }

  /**
   * Save white label settings
   * @param {string} organizationId - Organization ID
   * @param {Object} settings - White label settings
   * @returns {Promise<Object>} - Updated settings
   */
  async saveWhiteLabelSettings(organizationId, settings) {
    try {
      const updatedSettings = await SupabaseService.saveWhiteLabelSettings(organizationId, settings);
      
      if (updatedSettings && this.currentOrganization && this.currentOrganization.id === organizationId) {
        this.whiteLabelSettings = updatedSettings;
        this.applyWhiteLabelSettings(updatedSettings);
      }
      
      return updatedSettings;
    } catch (error) {
      console.error('Error saving white label settings:', error);
      throw error;
    }
  }

  /**
   * Apply white label settings to the application
   * @param {Object} settings - White label settings
   */
  applyWhiteLabelSettings(settings) {
    if (!settings) return;
    
    try {
      // Apply favicon
      if (settings.favicon_url) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
          favicon.href = settings.favicon_url;
        } else {
          const newFavicon = document.createElement('link');
          newFavicon.rel = 'icon';
          newFavicon.href = settings.favicon_url;
          document.head.appendChild(newFavicon);
        }
      }
      
      // Apply title
      if (settings.application_name) {
        document.title = settings.application_name;
      }
      
      // Apply primary color
      if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary-color', settings.primary_color);
      }
      
      // Apply secondary color
      if (settings.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
      }
      
      // Apply text color
      if (settings.text_color) {
        document.documentElement.style.setProperty('--text-color', settings.text_color);
      }
      
      // Apply background color
      if (settings.background_color) {
        document.documentElement.style.setProperty('--background-color', settings.background_color);
      }
      
      // Apply custom CSS
      if (settings.custom_css) {
        let customStyle = document.getElementById('white-label-custom-css');
        
        if (!customStyle) {
          customStyle = document.createElement('style');
          customStyle.id = 'white-label-custom-css';
          document.head.appendChild(customStyle);
        }
        
        customStyle.textContent = settings.custom_css;
      }
    } catch (error) {
      console.error('Error applying white label settings:', error);
    }
  }

  /**
   * Get organization users
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of users
   */
  async getOrganizationUsers(organizationId) {
    try {
      return await SupabaseService.getOrganizationUsers(organizationId);
    } catch (error) {
      console.error('Error getting organization users:', error);
      return [];
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
      return await SupabaseService.getUsersByRole(role, organizationId);
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  /**
   * Get system settings
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object|null>} - System settings
   */
  async getSystemSettings(organizationId) {
    try {
      return await SupabaseService.getSystemSettings(organizationId);
    } catch (error) {
      console.error('Error getting system settings:', error);
      return null;
    }
  }

  /**
   * Save system settings
   * @param {string} organizationId - Organization ID
   * @param {Object} settings - System settings
   * @returns {Promise<Object>} - Updated settings
   */
  async saveSystemSettings(organizationId, settings) {
    try {
      return await SupabaseService.saveSystemSettings(organizationId, settings);
    } catch (error) {
      console.error('Error saving system settings:', error);
      throw error;
    }
  }

  /**
   * Get organization statistics
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Organization statistics
   */
  async getOrganizationStatistics(organizationId) {
    try {
      // Get users
      const users = await SupabaseService.getOrganizationUsers(organizationId);
      
      // Get transactions
      const transactions = await SupabaseService.getTransactions({ organizationId });
      
      // Calculate statistics
      const stats = {
        userCount: users.length,
        roleDistribution: this.calculateRoleDistribution(users),
        transactionCount: transactions.length,
        transactionVolume: this.calculateTransactionVolume(transactions),
        transactionStatusDistribution: this.calculateTransactionStatusDistribution(transactions),
        transactionTypeDistribution: this.calculateTransactionTypeDistribution(transactions)
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting organization statistics:', error);
      return null;
    }
  }

  /**
   * Calculate role distribution
   * @param {Array} users - Array of users
   * @returns {Object} - Role distribution
   */
  calculateRoleDistribution(users) {
    const distribution = {};
    
    users.forEach(user => {
      const role = user.role || 'user';
      
      if (!distribution[role]) {
        distribution[role] = 0;
      }
      
      distribution[role] += 1;
    });
    
    return distribution;
  }

  /**
   * Calculate transaction volume
   * @param {Array} transactions - Array of transactions
   * @returns {number} - Transaction volume
   */
  calculateTransactionVolume(transactions) {
    return transactions.reduce((sum, transaction) => {
      return sum + (parseFloat(transaction.amount) || 0);
    }, 0);
  }

  /**
   * Calculate transaction status distribution
   * @param {Array} transactions - Array of transactions
   * @returns {Object} - Status distribution
   */
  calculateTransactionStatusDistribution(transactions) {
    const distribution = {
      approved: 0,
      rejected: 0,
      pending: 0
    };
    
    transactions.forEach(transaction => {
      const status = transaction.status || 'pending';
      
      if (distribution[status] !== undefined) {
        distribution[status] += 1;
      }
    });
    
    return distribution;
  }

  /**
   * Calculate transaction type distribution
   * @param {Array} transactions - Array of transactions
   * @returns {Object} - Type distribution
   */
  calculateTransactionTypeDistribution(transactions) {
    const distribution = {};
    
    transactions.forEach(transaction => {
      const type = transaction.type || 'unknown';
      
      if (!distribution[type]) {
        distribution[type] = 0;
      }
      
      distribution[type] += 1;
    });
    
    return distribution;
  }
}

export const OrganizationManager = new OrganizationManagerClass();