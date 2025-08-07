import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '@/components/common/SafeIcon';
import { AppStateManager } from '../../services/AppStateManager';
import { SupabaseService } from '../../services/SupabaseService';
import { toast } from 'react-toastify';
import Tooltip from '../common/Tooltip';

const WhiteLabelingSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [formData, setFormData] = useState({
    custom_domain: '',
    custom_login_page: false,
    custom_css: '',
    logo_url: '',
    favicon_url: '',
    company_name: '',
    contact_email: '',
    support_url: '',
    terms_url: '',
    privacy_url: '',
    enable_custom_emails: false
  });
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = AppStateManager.getCurrentUser();
        setCurrentUser(user);
        
        if (user.role !== 'super_admin') {
          setLoading(false);
          return;
        }
        
        // Load all organizations
        const orgs = await SupabaseService.getAllOrganizations();
        setOrganizations(orgs);
        
        if (orgs.length > 0) {
          // Select first organization by default
          setSelectedOrganization(orgs[0]);
          
          // Load white label settings for first organization
          const whiteLabel = await SupabaseService.getWhiteLabelSettings(orgs[0].id);
          
          if (whiteLabel) {
            setFormData({
              custom_domain: whiteLabel.custom_domain || '',
              custom_login_page: whiteLabel.custom_login_page || false,
              custom_css: whiteLabel.custom_css || '',
              logo_url: whiteLabel.logo_url || orgs[0].logo_url || '',
              favicon_url: whiteLabel.favicon_url || '',
              company_name: whiteLabel.company_name || orgs[0].name || '',
              contact_email: whiteLabel.contact_email || '',
              support_url: whiteLabel.support_url || '',
              terms_url: whiteLabel.terms_url || '',
              privacy_url: whiteLabel.privacy_url || '',
              enable_custom_emails: whiteLabel.enable_custom_emails || false
            });
          } else {
            // Initialize with organization defaults
            setFormData({
              ...formData,
              logo_url: orgs[0].logo_url || '',
              company_name: orgs[0].name || ''
            });
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load white labeling data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleOrganizationChange = async (e) => {
    const orgId = e.target.value;
    const org = organizations.find(o => o.id === orgId);
    setSelectedOrganization(org);
    
    try {
      setLoading(true);
      
      // Load white label settings for selected organization
      const whiteLabel = await SupabaseService.getWhiteLabelSettings(orgId);
      
      if (whiteLabel) {
        setFormData({
          custom_domain: whiteLabel.custom_domain || '',
          custom_login_page: whiteLabel.custom_login_page || false,
          custom_css: whiteLabel.custom_css || '',
          logo_url: whiteLabel.logo_url || org.logo_url || '',
          favicon_url: whiteLabel.favicon_url || '',
          company_name: whiteLabel.company_name || org.name || '',
          contact_email: whiteLabel.contact_email || '',
          support_url: whiteLabel.support_url || '',
          terms_url: whiteLabel.terms_url || '',
          privacy_url: whiteLabel.privacy_url || '',
          enable_custom_emails: whiteLabel.enable_custom_emails || false
        });
      } else {
        // Initialize with organization defaults
        setFormData({
          custom_domain: '',
          custom_login_page: false,
          custom_css: '',
          logo_url: org.logo_url || '',
          favicon_url: '',
          company_name: org.name || '',
          contact_email: '',
          support_url: '',
          terms_url: '',
          privacy_url: '',
          enable_custom_emails: false
        });
      }
    } catch (error) {
      console.error('Error loading white label settings:', error);
      toast.error('Failed to load white label settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (!selectedOrganization) {
        toast.error('No organization selected');
        return;
      }
      
      await SupabaseService.saveWhiteLabelSettings(selectedOrganization.id, formData);
      
      // Create system log
      await SupabaseService.createSystemLog({
        type: 'white_label_update',
        user: currentUser.name,
        reason: 'Updated white labeling settings',
        organization_id: selectedOrganization.id
      });
      
      toast.success('White labeling settings updated successfully');
    } catch (error) {
      console.error('Error updating white labeling:', error);
      toast.error('Failed to update white labeling settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <SafeIcon icon={FiIcons.FiLoader} className="animate-spin text-3xl text-blue-500" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <SafeIcon icon={FiIcons.FiLock} className="text-5xl text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500 text-center max-w-md">
          You don't have permission to access the White Labeling settings.
          This feature is available only to Super Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">White Labeling Settings</h1>
        <p className="text-gray-600">Customize the appearance for client organizations</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Organization</label>
          <select
            value={selectedOrganization?.id || ''}
            onChange={handleOrganizationChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={organizations.length === 0}
          >
            {organizations.length === 0 && (
              <option value="">No organizations available</option>
            )}
            {organizations.map(org => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {selectedOrganization && (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Domain & Branding</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Domain
                    <Tooltip content="The custom domain for the organization's instance (e.g., trading.clientname.com)">
                      <SafeIcon icon={FiIcons.FiInfo} className="ml-1 text-gray-400" />
                    </Tooltip>
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      name="custom_domain"
                      value={formData.custom_domain}
                      onChange={handleInputChange}
                      placeholder="trading.clientname.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Domain must be configured in DNS and SSL must be set up.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="Client Company Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {formData.logo_url && (
                  <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-md">
                    <p className="text-sm font-medium text-gray-700 mb-2">Logo Preview</p>
                    <div className="flex justify-center bg-white p-4 rounded">
                      <img 
                        src={formData.logo_url} 
                        alt="Organization Logo" 
                        className="max-h-16 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/200x50?text=Invalid+Image+URL';
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Favicon URL
                  </label>
                  <input
                    type="url"
                    name="favicon_url"
                    value={formData.favicon_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/favicon.ico"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended size: 32x32px, format: .ico, .png
                  </p>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-4">Customization Options</h2>
                
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="custom_login_page"
                    name="custom_login_page"
                    checked={formData.custom_login_page}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="custom_login_page" className="ml-2 block text-sm text-gray-700">
                    Enable Custom Login Page
                    <Tooltip content="Replace the default login page with a custom branded version">
                      <SafeIcon icon={FiIcons.FiInfo} className="ml-1 text-gray-400" />
                    </Tooltip>
                  </label>
                </div>
                
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="enable_custom_emails"
                    name="enable_custom_emails"
                    checked={formData.enable_custom_emails}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enable_custom_emails" className="ml-2 block text-sm text-gray-700">
                    Enable Custom Email Templates
                    <Tooltip content="Use custom branded email templates for notifications">
                      <SafeIcon icon={FiIcons.FiInfo} className="ml-1 text-gray-400" />
                    </Tooltip>
                  </label>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    placeholder="support@clientname.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Support URL
                  </label>
                  <input
                    type="url"
                    name="support_url"
                    value={formData.support_url}
                    onChange={handleInputChange}
                    placeholder="https://help.clientname.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms of Service URL
                  </label>
                  <input
                    type="url"
                    name="terms_url"
                    value={formData.terms_url}
                    onChange={handleInputChange}
                    placeholder="https://clientname.com/terms"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Privacy Policy URL
                  </label>
                  <input
                    type="url"
                    name="privacy_url"
                    value={formData.privacy_url}
                    onChange={handleInputChange}
                    placeholder="https://clientname.com/privacy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Advanced Customization</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom CSS
                  <Tooltip content="Add custom CSS to override default styling">
                    <SafeIcon icon={FiIcons.FiInfo} className="ml-1 text-gray-400" />
                  </Tooltip>
                </label>
                <textarea
                  name="custom_css"
                  value={formData.custom_css}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder=":root { --primary-color: #ff0000; }\n.header { background-color: #000000; }"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Custom CSS will be injected into the application. Use with caution.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <motion.button
                type="submit"
                disabled={saving || !selectedOrganization}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                {saving ? (
                  <>
                    <SafeIcon icon={FiIcons.FiLoader} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SafeIcon icon={FiIcons.FiSave} className="mr-2" />
                    Save White Label Settings
                  </>
                )}
              </motion.button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WhiteLabelingSettings;