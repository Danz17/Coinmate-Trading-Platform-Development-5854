import { SupabaseService } from './SupabaseService';
import { AppStateManager } from './AppStateManager';

class SecurityServiceClass {
  constructor() {
    this.settings = {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      },
      sessionPolicy: {
        maxInactiveTime: 30, // minutes
        maxSessionDuration: 24 // hours
      },
      apiPolicy: {
        rateLimiting: true,
        maxRequestsPerMinute: 60
      },
      dataPolicy: {
        encryptSensitiveData: true,
        dataRetentionPeriod: 365 // days
      },
      accessPolicy: {
        allowedIPs: [],
        restrictToOrganizationIPs: false
      }
    };
    this.inactivityTimer = null;
    this.isInitialized = false;
    this.currentOrganizationId = null;
  }

  /**
   * Initialize security service
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Get current organization
    const organization = AppStateManager.getCurrentOrganization();
    if (organization) {
      this.currentOrganizationId = organization.id;
      this.loadSecuritySettings(organization.id);
    }
    
    // Add organization change listener
    AppStateManager.addListener('organization', (organization) => {
      if (organization && this.currentOrganizationId !== organization.id) {
        this.currentOrganizationId = organization.id;
        this.loadSecuritySettings(organization.id);
      }
    });
    
    // Start inactivity timer
    this.startInactivityTimer();
    
    // Add activity event listeners
    this.addActivityListeners();
    
    this.isInitialized = true;
  }

  /**
   * Load security settings for organization
   * @param {string} organizationId - Organization ID
   */
  async loadSecuritySettings(organizationId) {
    try {
      const systemSettings = await SupabaseService.getSystemSettings(organizationId);
      
      if (systemSettings && systemSettings.security) {
        this.settings = {
          ...this.settings,
          ...systemSettings.security
        };
        
        // Update inactivity timer
        this.resetInactivityTimer();
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  }

  /**
   * Add activity event listeners
   */
  addActivityListeners() {
    // Reset timer on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(eventName => {
      document.addEventListener(eventName, () => this.resetInactivityTimer(), true);
    });
    
    // Add beforeunload event listener
    window.addEventListener('beforeunload', () => {
      // Clean up timers
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
      }
    });
  }

  /**
   * Start inactivity timer
   */
  startInactivityTimer() {
    this.resetInactivityTimer();
  }

  /**
   * Reset inactivity timer
   */
  resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    // Only start timer if user is authenticated
    const state = AppStateManager.getState();
    if (!state.isAuthenticated) return;
    
    const maxInactiveTime = this.settings.sessionPolicy.maxInactiveTime || 30;
    
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, maxInactiveTime * 60 * 1000);
  }

  /**
   * Handle inactivity timeout
   */
  async handleInactivityTimeout() {
    console.log('Session timed out due to inactivity');
    
    // Log the user out
    await AppStateManager.logoutUser();
    
    // Show timeout message
    alert('Your session has expired due to inactivity. Please log in again.');
  }

  /**
   * Validate password
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result
   */
  validatePassword(password) {
    const policy = this.settings.passwordPolicy;
    const result = {
      valid: true,
      errors: []
    };
    
    // Check minimum length
    if (password.length < policy.minLength) {
      result.valid = false;
      result.errors.push(`Password must be at least ${policy.minLength} characters long`);
    }
    
    // Check for uppercase letters
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      result.valid = false;
      result.errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for lowercase letters
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      result.valid = false;
      result.errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for numbers
    if (policy.requireNumbers && !/[0-9]/.test(password)) {
      result.valid = false;
      result.errors.push('Password must contain at least one number');
    }
    
    // Check for special characters
    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      result.valid = false;
      result.errors.push('Password must contain at least one special character');
    }
    
    return result;
  }

  /**
   * Check if IP is allowed
   * @param {string} ip - IP address to check
   * @returns {boolean} - Whether IP is allowed
   */
  isIPAllowed(ip) {
    const policy = this.settings.accessPolicy;
    
    // If no IP restrictions, allow all
    if (!policy.restrictToOrganizationIPs || policy.allowedIPs.length === 0) {
      return true;
    }
    
    // Check if IP is in allowed list
    return policy.allowedIPs.includes(ip);
  }

  /**
   * Add allowed IP
   * @param {string} ip - IP address to add
   */
  addAllowedIP(ip) {
    if (!this.settings.accessPolicy.allowedIPs.includes(ip)) {
      this.settings.accessPolicy.allowedIPs.push(ip);
      this.saveSettings();
    }
  }

  /**
   * Remove allowed IP
   * @param {string} ip - IP address to remove
   */
  removeAllowedIP(ip) {
    this.settings.accessPolicy.allowedIPs = this.settings.accessPolicy.allowedIPs.filter(
      allowedIP => allowedIP !== ip
    );
    this.saveSettings();
  }

  /**
   * Save security settings
   */
  async saveSettings() {
    try {
      if (!this.currentOrganizationId) return;
      
      const systemSettings = await SupabaseService.getSystemSettings(this.currentOrganizationId);
      
      const updatedSettings = {
        ...systemSettings,
        security: this.settings
      };
      
      await SupabaseService.saveSystemSettings(this.currentOrganizationId, updatedSettings);
    } catch (error) {
      console.error('Error saving security settings:', error);
    }
  }

  /**
   * Update password policy
   * @param {Object} policy - Password policy
   */
  updatePasswordPolicy(policy) {
    this.settings.passwordPolicy = {
      ...this.settings.passwordPolicy,
      ...policy
    };
    this.saveSettings();
  }

  /**
   * Update session policy
   * @param {Object} policy - Session policy
   */
  updateSessionPolicy(policy) {
    this.settings.sessionPolicy = {
      ...this.settings.sessionPolicy,
      ...policy
    };
    
    // Update inactivity timer
    this.resetInactivityTimer();
    
    this.saveSettings();
  }

  /**
   * Update API policy
   * @param {Object} policy - API policy
   */
  updateAPIPolicy(policy) {
    this.settings.apiPolicy = {
      ...this.settings.apiPolicy,
      ...policy
    };
    this.saveSettings();
  }

  /**
   * Update data policy
   * @param {Object} policy - Data policy
   */
  updateDataPolicy(policy) {
    this.settings.dataPolicy = {
      ...this.settings.dataPolicy,
      ...policy
    };
    this.saveSettings();
  }

  /**
   * Update access policy
   * @param {Object} policy - Access policy
   */
  updateAccessPolicy(policy) {
    this.settings.accessPolicy = {
      ...this.settings.accessPolicy,
      ...policy
    };
    this.saveSettings();
  }

  /**
   * Get security settings
   * @returns {Object} - Security settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Clean up security service
   */
  cleanup() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    this.isInitialized = false;
  }
}

export const SecurityService = new SecurityServiceClass();