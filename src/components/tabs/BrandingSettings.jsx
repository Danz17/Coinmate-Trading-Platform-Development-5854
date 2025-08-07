import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { AppStateManager } from '../../services/AppStateManager';
import { SupabaseService } from '../../services/SupabaseService';
import { toast } from 'react-toastify';

const BrandingSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    accent_color: '#60A5FA'
  });
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = AppStateManager.getCurrentUser();
        setCurrentUser(user);
        
        const org = AppStateManager.getCurrentOrganization();
        if (org) {
          setCurrentOrg(org);
          setFormData({
            name: org.name,
            logo_url: org.logo_url || '',
            primary_color: org.primary_color || '#3B82F6',
            secondary_color: org.secondary_color || '#1E40AF',
            accent_color: org.accent_color || '#60A5FA'
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Organization name cannot be changed, so exclude it
      const { name, ...updateData } = formData;
      
      await SupabaseService.updateOrganization(currentOrg.id, updateData);
      
      // Update current organization in AppStateManager
      const updatedOrg = { ...currentOrg, ...updateData };
      await AppStateManager.setCurrentOrganization(updatedOrg);
      setCurrentOrg(updatedOrg);
      
      // Create system log
      await SupabaseService.createSystemLog({
        type: 'branding_update',
        user: currentUser.name,
        reason: 'Updated organization branding',
        organization_id: currentOrg.id
      });
      
      toast.success('Branding settings updated successfully');
      
      // Apply theme changes immediately
      document.documentElement.style.setProperty('--primary-color', updateData.primary_color);
      document.documentElement.style.setProperty('--secondary-color', updateData.secondary_color);
      document.documentElement.style.setProperty('--accent-color', updateData.accent_color);
    } catch (error) {
      console.error('Error updating branding:', error);
      toast.error('Failed to update branding settings');
    } finally {
      setSaving(false);
    }
  };

  const togglePreview = () => {
    setPreview(!preview);
    
    if (!preview) {
      // Store current theme
      const currentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
      const currentSecondary = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color');
      const currentAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
      
      // Apply preview theme
      document.documentElement.style.setProperty('--primary-color', formData.primary_color);
      document.documentElement.style.setProperty('--secondary-color', formData.secondary_color);
      document.documentElement.style.setProperty('--accent-color', formData.accent_color);
      
      // Store original values for reset
      document.documentElement.dataset.originalPrimary = currentPrimary;
      document.documentElement.dataset.originalSecondary = currentSecondary;
      document.documentElement.dataset.originalAccent = currentAccent;
    } else {
      // Restore original theme
      document.documentElement.style.setProperty('--primary-color', document.documentElement.dataset.originalPrimary);
      document.documentElement.style.setProperty('--secondary-color', document.documentElement.dataset.originalSecondary);
      document.documentElement.style.setProperty('--accent-color', document.documentElement.dataset.originalAccent);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <SafeIcon icon={FiIcons.FiLoader} className="animate-spin text-3xl text-blue-500" />
      </div>
    );
  }

  if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <SafeIcon icon={FiIcons.FiLock} className="text-5xl text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Access Restricted</h2>
        <p className="text-gray-500 text-center max-w-md">
          You don't have permission to access the Branding settings.
          This feature is available only to Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Branding Settings</h1>
          <p className="text-gray-600">Customize the appearance of your organization</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-4 py-2 rounded-md flex items-center ${
            preview ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'
          }`}
          onClick={togglePreview}
        >
          <SafeIcon icon={preview ? FiIcons.FiEyeOff : FiIcons.FiEye} className="mr-2" />
          {preview ? 'Exit Preview' : 'Preview Changes'}
        </motion.button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Organization Details</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-gray-600 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Organization name cannot be changed. Contact support if you need to rename your organization.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <div className="flex">
                  <input
                    type="url"
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter a valid image URL. Recommended size: 200x50px.
                </p>
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
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Theme Colors</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="primary_color"
                    value={formData.primary_color}
                    onChange={handleInputChange}
                    className="w-10 h-10 p-0 border-0 rounded mr-3"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Used for primary buttons, links, and active states.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="secondary_color"
                    value={formData.secondary_color}
                    onChange={handleInputChange}
                    className="w-10 h-10 p-0 border-0 rounded mr-3"
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Used for header, footer, and secondary elements.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    name="accent_color"
                    value={formData.accent_color}
                    onChange={handleInputChange}
                    className="w-10 h-10 p-0 border-0 rounded mr-3"
                  />
                  <input
                    type="text"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Used for highlights, notifications, and call-to-action elements.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-md">
            <h3 className="text-md font-semibold mb-2">Theme Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className="p-4 rounded-md text-white flex items-center justify-center"
                style={{ backgroundColor: formData.primary_color }}
              >
                Primary
              </div>
              <div 
                className="p-4 rounded-md text-white flex items-center justify-center"
                style={{ backgroundColor: formData.secondary_color }}
              >
                Secondary
              </div>
              <div 
                className="p-4 rounded-md text-white flex items-center justify-center"
                style={{ backgroundColor: formData.accent_color }}
              >
                Accent
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <button 
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Normal Button
              </button>
              <button 
                type="button"
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: formData.primary_color }}
              >
                Primary Button
              </button>
              <button 
                type="button"
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: formData.secondary_color }}
              >
                Secondary Button
              </button>
              <button 
                type="button"
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: formData.accent_color }}
              >
                Accent Button
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <motion.button
              type="submit"
              disabled={saving}
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
                  Save Changes
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandingSettings;