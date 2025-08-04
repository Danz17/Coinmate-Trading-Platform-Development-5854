import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { OrganizationManager } from '../../services/OrganizationManager';
import { AppStateManager } from '../../services/AppStateManager';
import { toastManager } from '../common/Toast';
import SystemSettings from './SystemSettings';
import RoleManagement from '../admin/RoleManagement';
import supabase from '../../lib/supabase';

const { FiUpload, FiSave, FiPlus, FiTrash2, FiEdit3, FiCheck, FiX, FiGlobe, FiBriefcase, FiRefreshCw, FiSettings, FiShield } = FiIcons;

const WhiteLabelingSettings = ({ currentUser }) => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('branding');
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    display_name: '',
    logo_url: '',
    favicon_url: '',
    primary_color_light: '#2563eb',
    primary_color_dark: '#3b82f6',
    features: {
      trade: true,
      eod: true,
      hr: true,
      analytics: true
    }
  });
  const [editedOrgData, setEditedOrgData] = useState({});
  const [organizationAdmins, setOrganizationAdmins] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedAdminToAdd, setSelectedAdminToAdd] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Load organizations
      await OrganizationManager.initialize();
      const orgs = await OrganizationManager.loadOrganizations();
      setOrganizations(orgs);

      // Set current organization as selected
      const currentOrg = OrganizationManager.getCurrentOrganization();
      if (currentOrg) {
        setSelectedOrganization(currentOrg);
        setEditedOrgData({ ...currentOrg });
        loadOrganizationAdmins(currentOrg.id);
      }

      // Load all users for admin assignment
      const users = await AppStateManager.getUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Error loading white labeling settings:', error);
      toastManager.error('Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizationAdmins = async (organizationId) => {
    try {
      const admins = await OrganizationManager.getOrganizationAdmins(organizationId);
      setOrganizationAdmins(admins);
    } catch (error) {
      console.error('Error loading organization admins:', error);
    }
  };

  const handleOrganizationSelect = async (orgId) => {
    const organization = organizations.find(org => org.id === orgId);
    if (organization) {
      setSelectedOrganization(organization);
      setEditedOrgData({ ...organization });
      await loadOrganizationAdmins(organization.id);
      setActiveSubTab('branding'); // Reset to branding tab when switching org
    }
  };

  const handleFileUpload = async (file, type, targetState) => {
    if (!file) return;

    const setUploading = type === 'favicon' ? setUploadingFavicon : setUploadingLogo;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `organizations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      if (targetState === 'new') {
        setNewOrgData(prev => ({ ...prev, [`${type}_url`]: publicUrl }));
      } else {
        setEditedOrgData(prev => ({ ...prev, [`${type}_url`]: publicUrl }));
      }

      toastManager.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toastManager.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!selectedOrganization) return;

    setIsSaving(true);
    try {
      await OrganizationManager.updateOrganization(
        selectedOrganization.id,
        editedOrgData
      );
      setEditMode(false);
      await loadData();
    } catch (error) {
      console.error('Error saving organization:', error);
      toastManager.error('Failed to update organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgData.name || !newOrgData.display_name) {
      toastManager.error('Organization name and display name are required');
      return;
    }

    setIsSaving(true);
    try {
      await OrganizationManager.createOrganization(newOrgData);
      setShowAddModal(false);
      // Reset form
      setNewOrgData({
        name: '',
        display_name: '',
        logo_url: '',
        favicon_url: '',
        primary_color_light: '#2563eb',
        primary_color_dark: '#3b82f6',
        features: {
          trade: true,
          eod: true,
          hr: true,
          analytics: true
        }
      });
      await loadData();
    } catch (error) {
      console.error('Error creating organization:', error);
      toastManager.error('Failed to create organization');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!selectedOrganization) return;

    setIsSaving(true);
    try {
      await OrganizationManager.deleteOrganization(selectedOrganization.id);
      setShowDeleteModal(false);
      await loadData();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toastManager.error(`Failed to delete organization: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultOrganization = async () => {
    if (!selectedOrganization) return;

    try {
      await OrganizationManager.setDefaultOrganization(selectedOrganization.id);
      await loadData();
    } catch (error) {
      console.error('Error setting default organization:', error);
      toastManager.error('Failed to set default organization');
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedOrganization || !selectedAdminToAdd) return;

    try {
      await OrganizationManager.addOrganizationAdmin(selectedOrganization.id, selectedAdminToAdd);
      await loadOrganizationAdmins(selectedOrganization.id);
      setSelectedAdminToAdd('');
    } catch (error) {
      console.error('Error adding organization admin:', error);
      toastManager.error('Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!selectedOrganization) return;

    try {
      await OrganizationManager.removeOrganizationAdmin(selectedOrganization.id, userId);
      await loadOrganizationAdmins(selectedOrganization.id);
    } catch (error) {
      console.error('Error removing organization admin:', error);
      toastManager.error('Failed to remove admin');
    }
  };

  // Check permissions - only super admins can manage organizations, admins can only view/edit settings for their org
  const canManageOrganizations = currentUser.role === 'super_admin';
  const canEditSettings = ['super_admin', 'admin'].includes(currentUser.role);

  if (!canEditSettings) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
        <SafeIcon icon={FiX} className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Access Restricted</h2>
        <p className="text-yellow-700 dark:text-yellow-300">
          You don't have permission to access organization settings.
        </p>
      </div>
    );
  }

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
            Organization Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {canManageOrganizations ? 'Manage organizations and their settings' : 'Configure your organization settings'}
          </p>
        </div>
        {canManageOrganizations && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4" />
            <span>Add Organization</span>
          </button>
        )}
      </div>

      {/* Organization Selection (only for super admins) */}
      {canManageOrganizations && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Organization
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                onClick={() => handleOrganizationSelect(org.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedOrganization?.id === org.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {org.display_name || org.name}
                  </h3>
                  {org.is_default && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <SafeIcon icon={FiBriefcase} className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {org.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Organization Settings */}
      {selectedOrganization && (
        <div className="card">
          {/* Sub-navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-6 px-6">
              <button
                onClick={() => setActiveSubTab('branding')}
                className={`py-4 border-b-2 font-medium text-sm focus:outline-none ${
                  activeSubTab === 'branding'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <SafeIcon icon={FiGlobe} className="w-4 h-4 mr-2" />
                  <span>Branding</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveSubTab('system')}
                className={`py-4 border-b-2 font-medium text-sm focus:outline-none ${
                  activeSubTab === 'system'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <SafeIcon icon={FiSettings} className="w-4 h-4 mr-2" />
                  <span>System Settings</span>
                </div>
              </button>

              {canEditSettings && (
                <button
                  onClick={() => setActiveSubTab('roles')}
                  className={`py-4 border-b-2 font-medium text-sm focus:outline-none ${
                    activeSubTab === 'roles'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <SafeIcon icon={FiShield} className="w-4 h-4 mr-2" />
                    <span>Role Management</span>
                  </div>
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeSubTab === 'branding' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editMode ? 'Edit Organization' : 'Organization Branding'}
                  </h2>
                  <div className="flex items-center space-x-3">
                    {!editMode ? (
                      <>
                        {canManageOrganizations && !selectedOrganization.is_default && (
                          <button
                            onClick={handleSetDefaultOrganization}
                            className="btn-secondary text-sm"
                          >
                            Set as Default
                          </button>
                        )}
                        {canEditSettings && (
                          <button
                            onClick={() => setEditMode(true)}
                            className="btn-secondary flex items-center space-x-2 text-sm"
                          >
                            <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                        )}
                        {canManageOrganizations && !selectedOrganization.is_default && (
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="btn-danger text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveOrganization}
                          disabled={isSaving}
                          className="btn-primary flex items-center space-x-2 text-sm"
                        >
                          <SafeIcon icon={isSaving ? FiRefreshCw : FiSave} className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditMode(false);
                            setEditedOrgData({ ...selectedOrganization });
                          }}
                          className="btn-secondary text-sm"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Render branding form - same as before but simplified */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Organization ID
                        </label>
                        <input
                          type="text"
                          value={selectedOrganization.name}
                          className="input-field bg-gray-100 dark:bg-gray-700"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={editMode ? editedOrgData.display_name : selectedOrganization.display_name}
                          onChange={(e) => setEditedOrgData(prev => ({ ...prev, display_name: e.target.value }))}
                          className="input-field"
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Status
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-block w-3 h-3 rounded-full ${selectedOrganization.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {selectedOrganization.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {editMode && (
                            <label className="relative inline-flex items-center cursor-pointer ml-2">
                              <input
                                type="checkbox"
                                checked={editedOrgData.is_active}
                                onChange={() => setEditedOrgData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Branding */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                      Branding
                    </h3>
                    <div className="space-y-4">
                      {/* Logo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Logo
                        </label>
                        <div className="flex items-center space-x-4">
                          {(editMode ? editedOrgData.logo_url : selectedOrganization.logo_url) ? (
                            <img
                              src={editMode ? editedOrgData.logo_url : selectedOrganization.logo_url}
                              alt="Logo"
                              className="h-12 max-w-48 object-contain bg-gray-100 dark:bg-gray-800 p-1 rounded"
                            />
                          ) : (
                            <div className="h-12 w-48 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                              <span className="text-sm text-gray-500 dark:text-gray-400">No logo</span>
                            </div>
                          )}
                          {editMode && (
                            <label className="btn-secondary cursor-pointer flex items-center space-x-2">
                              <SafeIcon icon={uploadingLogo ? FiRefreshCw : FiUpload} className={`w-4 h-4 ${uploadingLogo ? 'animate-spin' : ''}`} />
                              <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                              <input
                                type="file"
                                accept=".png,.jpg,.jpeg,.svg"
                                onChange={(e) => handleFileUpload(e.target.files[0], 'logo', 'edit')}
                                className="hidden"
                                disabled={uploadingLogo}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Colors */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Primary Color (Light Mode)
                        </label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="color"
                            value={editMode ? editedOrgData.primary_color_light : selectedOrganization.primary_color_light}
                            onChange={(e) => setEditedOrgData(prev => ({ ...prev, primary_color_light: e.target.value }))}
                            className="w-12 h-12 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            disabled={!editMode}
                          />
                          <input
                            type="text"
                            value={editMode ? editedOrgData.primary_color_light : selectedOrganization.primary_color_light}
                            onChange={(e) => setEditedOrgData(prev => ({ ...prev, primary_color_light: e.target.value }))}
                            className="input-field font-mono"
                            disabled={!editMode}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'system' && (
              <SystemSettings currentUser={currentUser} />
            )}

            {activeSubTab === 'roles' && canEditSettings && (
              <RoleManagement currentUser={currentUser} />
            )}
          </div>
        </div>
      )}

      {/* Add Organization Modal - same as before */}
      {showAddModal && canManageOrganizations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New Organization
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization ID *
                  </label>
                  <input
                    type="text"
                    value={newOrgData.name}
                    onChange={(e) => setNewOrgData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    placeholder="lowercase_with_underscores"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used as internal identifier. Use lowercase with underscores.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={newOrgData.display_name}
                    onChange={(e) => setNewOrgData(prev => ({ ...prev, display_name: e.target.value }))}
                    className="input-field"
                    placeholder="Organization Display Name"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrganization}
                  disabled={isSaving || !newOrgData.name || !newOrgData.display_name}
                  className="btn-primary flex items-center space-x-2"
                >
                  <SafeIcon icon={isSaving ? FiRefreshCw : FiSave} className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Creating...' : 'Create Organization'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Organization Modal - same as before */}
      {showDeleteModal && selectedOrganization && canManageOrganizations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Delete Organization
              </h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <SafeIcon icon={FiX} className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <SafeIcon icon={FiTrash2} className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-300">
                    Confirm Deletion
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Are you sure you want to delete organization "{selectedOrganization.display_name || selectedOrganization.name}"?
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  This action cannot be undone. All data associated with this organization will be permanently deleted.
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrganization}
                  disabled={isSaving || selectedOrganization.is_default}
                  className="btn-danger flex items-center space-x-2"
                >
                  <SafeIcon icon={isSaving ? FiRefreshCw : FiTrash2} className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Deleting...' : 'Delete Organization'}</span>
                </button>
              </div>
              {selectedOrganization.is_default && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  <p>
                    <strong>Note:</strong> The default organization cannot be deleted.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WhiteLabelingSettings;