import { SupabaseService } from './SupabaseService';
import { AppStateManager } from './AppStateManager';
import { toastManager } from '../components/common/Toast';

class OrganizationManagerClass {
  constructor() {
    this.currentOrganization = null;
    this.organizations = [];
    this.subscribers = new Set();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load organizations
      await this.loadOrganizations();
      
      // Load current organization from localStorage or use default
      const savedOrgId = localStorage.getItem('coinmate-current-organization');
      
      if (savedOrgId) {
        this.currentOrganization = this.organizations.find(org => org.id === savedOrgId);
      }
      
      // If no organization is set or the saved one doesn't exist, use default
      if (!this.currentOrganization) {
        this.currentOrganization = this.organizations.find(org => org.is_default) || this.organizations[0];
      }

      if (this.currentOrganization) {
        // Save current organization to localStorage
        localStorage.setItem('coinmate-current-organization', this.currentOrganization.id);
        
        // Apply organization theme
        this.applyOrganizationTheme(this.currentOrganization);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OrganizationManager:', error);
    }
  }

  async loadOrganizations() {
    try {
      const organizations = await SupabaseService.getOrganizations();
      this.organizations = organizations || [];
      this.notify();
      return this.organizations;
    } catch (error) {
      console.error('Error loading organizations:', error);
      return [];
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.currentOrganization));
  }

  getCurrentOrganization() {
    return this.currentOrganization;
  }

  getOrganizations() {
    return this.organizations;
  }

  async switchOrganization(organizationId) {
    try {
      const organization = this.organizations.find(org => org.id === organizationId);
      
      if (!organization) {
        throw new Error('Organization not found');
      }

      this.currentOrganization = organization;
      localStorage.setItem('coinmate-current-organization', organization.id);
      
      // Apply organization theme
      this.applyOrganizationTheme(organization);
      
      // Reload app data for the new organization
      await AppStateManager.loadAllData();
      
      this.notify();
      
      return true;
    } catch (error) {
      console.error('Error switching organization:', error);
      toastManager.error('Failed to switch organization');
      return false;
    }
  }

  applyOrganizationTheme(organization) {
    if (!organization) return;

    const root = document.documentElement;
    
    // Set primary colors
    root.style.setProperty('--color-primary-500', organization.primary_color_light);
    root.style.setProperty('--color-primary-600', organization.primary_color_light);
    root.style.setProperty('--color-primary-700', organization.primary_color_dark);
    
    // Set favicon if available
    if (organization.favicon_url) {
      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon) {
        favicon.href = organization.favicon_url;
      }
    }
    
    // Set document title
    document.title = organization.display_name || organization.name;
  }

  async createOrganization(organizationData) {
    try {
      const newOrganization = await SupabaseService.createOrganization({
        name: organizationData.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: organizationData.display_name,
        logo_url: organizationData.logo_url,
        favicon_url: organizationData.favicon_url,
        primary_color_light: organizationData.primary_color_light || '#2563eb',
        primary_color_dark: organizationData.primary_color_dark || '#3b82f6',
        features: organizationData.features || {
          trade: true,
          eod: true,
          hr: true,
          analytics: true
        }
      });
      
      await this.loadOrganizations();
      
      return newOrganization;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  async updateOrganization(organizationId, updates) {
    try {
      const updatedOrganization = await SupabaseService.updateOrganization(organizationId, updates);
      
      // If updating current organization, apply theme changes
      if (this.currentOrganization && this.currentOrganization.id === organizationId) {
        this.currentOrganization = updatedOrganization;
        this.applyOrganizationTheme(updatedOrganization);
      }
      
      await this.loadOrganizations();
      
      return updatedOrganization;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  async deleteOrganization(organizationId) {
    // Check if it's the default organization
    const organization = this.organizations.find(org => org.id === organizationId);
    
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    if (organization.is_default) {
      throw new Error('Cannot delete the default organization');
    }
    
    try {
      await SupabaseService.deleteOrganization(organizationId);
      
      // If deleted organization was current, switch to default
      if (this.currentOrganization && this.currentOrganization.id === organizationId) {
        const defaultOrg = this.organizations.find(org => org.is_default);
        if (defaultOrg) {
          await this.switchOrganization(defaultOrg.id);
        }
      }
      
      await this.loadOrganizations();
      
      return true;
    } catch (error) {
      console.error('Error deleting organization:', error);
      throw error;
    }
  }

  async setDefaultOrganization(organizationId) {
    try {
      await SupabaseService.setDefaultOrganization(organizationId);
      await this.loadOrganizations();
      return true;
    } catch (error) {
      console.error('Error setting default organization:', error);
      throw error;
    }
  }

  async addOrganizationAdmin(organizationId, userId) {
    try {
      await SupabaseService.addOrganizationAdmin(organizationId, userId);
      return true;
    } catch (error) {
      console.error('Error adding organization admin:', error);
      throw error;
    }
  }

  async removeOrganizationAdmin(organizationId, userId) {
    try {
      await SupabaseService.removeOrganizationAdmin(organizationId, userId);
      return true;
    } catch (error) {
      console.error('Error removing organization admin:', error);
      throw error;
    }
  }

  async getOrganizationAdmins(organizationId) {
    try {
      return await SupabaseService.getOrganizationAdmins(organizationId);
    } catch (error) {
      console.error('Error getting organization admins:', error);
      return [];
    }
  }

  canManageOrganizations(userRole) {
    return userRole === 'super_admin';
  }

  getEnabledFeatures() {
    if (!this.currentOrganization) {
      return {
        trade: true,
        eod: true,
        hr: true,
        analytics: true
      };
    }
    
    return this.currentOrganization.features || {
      trade: true,
      eod: true,
      hr: true,
      analytics: true
    };
  }

  isFeatureEnabled(feature) {
    const features = this.getEnabledFeatures();
    return features[feature] === true;
  }
}

export const OrganizationManager = new OrganizationManagerClass();