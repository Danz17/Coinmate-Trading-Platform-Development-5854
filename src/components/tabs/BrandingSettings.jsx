import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { toastManager } from '../common/Toast';
import supabase from '../../lib/supabase';

const { FiUpload, FiSave, FiEye, FiRefreshCw } = FiIcons;

const BrandingSettings = ({ currentUser }) => {
  const [settings, setSettings] = useState({
    favicon_url: null,
    logo_url: null,
    primary_color_light: '#2563eb',
    primary_color_dark: '#3b82f6',
    company_name: 'Coinmate'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading branding settings:', error);
        toastManager.error('Failed to load branding settings');
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading branding settings:', error);
      toastManager.error('Failed to load branding settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    const setUploading = type === 'favicon' ? setUploadingFavicon : setUploadingLogo;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setSettings(prev => ({
        ...prev,
        [`${type}_url`]: publicUrl
      }));

      toastManager.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toastManager.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const handleColorChange = (colorType, value) => {
    setSettings(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  const applyPreview = () => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary-500', settings.primary_color_light);
    root.style.setProperty('--color-primary-600', settings.primary_color_light);
    root.style.setProperty('--color-primary-700', settings.primary_color_dark);
    
    if (settings.favicon_url) {
      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon) {
        favicon.href = settings.favicon_url;
      }
    }
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      applyPreview();
      toastManager.info('Preview mode enabled - changes are temporary');
    } else {
      window.location.reload(); // Reset to original
    }
  };

  const handleSave = async () => {
    if (!currentUser || !['super_admin', 'admin'].includes(currentUser.role)) {
      toastManager.error('Insufficient permissions to save branding settings');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('branding_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Apply changes permanently
      applyPreview();
      
      // Update document title
      document.title = settings.company_name;

      toastManager.success('Branding settings saved successfully', {
        action: {
          label: 'Reload Page',
          onClick: () => window.location.reload()
        }
      });
    } catch (error) {
      console.error('Error saving branding settings:', error);
      toastManager.error('Failed to save branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Branding Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your application's appearance and branding
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePreview}
            className={`btn-secondary flex items-center space-x-2 ${previewMode ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}
          >
            <SafeIcon icon={FiEye} className="w-4 h-4" />
            <span>{previewMode ? 'Exit Preview' : 'Preview'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center space-x-2"
          >
            <SafeIcon icon={isSaving ? FiRefreshCw : FiSave} className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Preview Warning */}
      {previewMode && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiEye} className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">
              Preview Mode Active
            </p>
          </div>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
            Changes are temporary. Click "Save Changes" to apply permanently.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo and Favicon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Logo & Favicon
          </h3>
          
          <div className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                className="input-field"
                placeholder="Enter company name"
              />
            </div>

            {/* Favicon Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Favicon (32x32 PNG/ICO)
              </label>
              <div className="flex items-center space-x-4">
                {settings.favicon_url && (
                  <img
                    src={settings.favicon_url}
                    alt="Favicon"
                    className="w-8 h-8 rounded"
                  />
                )}
                <label className="btn-secondary cursor-pointer flex items-center space-x-2">
                  <SafeIcon icon={uploadingFavicon ? FiRefreshCw : FiUpload} className={`w-4 h-4 ${uploadingFavicon ? 'animate-spin' : ''}`} />
                  <span>{uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}</span>
                  <input
                    type="file"
                    accept=".png,.ico,.jpg,.jpeg"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'favicon')}
                    className="hidden"
                    disabled={uploadingFavicon}
                  />
                </label>
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo (Recommended: 200x50 PNG)
              </label>
              <div className="flex items-center space-x-4">
                {settings.logo_url && (
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="h-12 max-w-48 object-contain"
                  />
                )}
                <label className="btn-secondary cursor-pointer flex items-center space-x-2">
                  <SafeIcon icon={uploadingLogo ? FiRefreshCw : FiUpload} className={`w-4 h-4 ${uploadingLogo ? 'animate-spin' : ''}`} />
                  <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'logo')}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Color Scheme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Color Scheme
          </h3>
          
          <div className="space-y-6">
            {/* Primary Color Light */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Color (Light Mode)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={settings.primary_color_light}
                  onChange={(e) => handleColorChange('primary_color_light', e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color_light}
                  onChange={(e) => handleColorChange('primary_color_light', e.target.value)}
                  className="input-field font-mono"
                  placeholder="#2563eb"
                />
              </div>
            </div>

            {/* Primary Color Dark */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Color (Dark Mode)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={settings.primary_color_dark}
                  onChange={(e) => handleColorChange('primary_color_dark', e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color_dark}
                  onChange={(e) => handleColorChange('primary_color_dark', e.target.value)}
                  className="input-field font-mono"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            {/* Color Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Light Mode</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <button
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: settings.primary_color_light }}
                    >
                      Primary Button
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dark Mode</p>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <button
                      className="px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: settings.primary_color_dark }}
                    >
                      Primary Button
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CSS Variables Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          CSS Variables
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          These CSS variables will be automatically updated when you save changes:
        </p>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <code className="text-sm text-gray-800 dark:text-gray-200">
            <div>--color-primary-500: {settings.primary_color_light}</div>
            <div>--color-primary-600: {settings.primary_color_light}</div>
            <div>--color-primary-700: {settings.primary_color_dark}</div>
          </code>
        </div>
      </motion.div>
    </div>
  );
};

export default BrandingSettings;