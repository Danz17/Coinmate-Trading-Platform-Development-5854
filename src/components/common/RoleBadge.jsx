import React from 'react';
import PropTypes from 'prop-types';
import * as FiIcons from 'react-icons/fi';
import { RoleManager } from '../../services/RoleManager';
import SafeIcon from '../../common/SafeIcon';

/**
 * Role Badge Component
 * Displays a user's role with appropriate styling and icon
 * 
 * @param {Object} props - Component props
 * @param {string} props.role - User role ID
 * @param {string} props.size - Badge size ('sm', 'md', 'lg')
 * @param {boolean} props.showIcon - Whether to show role icon
 * @param {boolean} props.showLabel - Whether to show role label
 * @returns {React.ReactElement} - Rendered role badge
 */
const RoleBadge = ({ role, size = 'md', showIcon = true, showLabel = true }) => {
  // Get role details from RoleManager
  const roleName = RoleManager.getRoleName(role) || role;
  const roleColor = RoleManager.getRoleColor(role) || 'gray';

  // Map role to icon
  const getRoleIcon = () => {
    switch (role) {
      case 'super_admin':
        return FiIcons.FiShield;
      case 'admin':
        return FiIcons.FiKey;
      case 'manager':
        return FiIcons.FiBriefcase;
      case 'analyst':
        return FiIcons.FiBarChart2;
      case 'trader':
        return FiIcons.FiTrendingUp;
      case 'user':
        return FiIcons.FiUser;
      default:
        return FiIcons.FiTag;
    }
  };

  // Map role to background color
  const getBgColor = () => {
    switch (roleColor) {
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'orange':
        return 'bg-orange-100 text-orange-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Map size to padding and text size
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3 py-1.5 text-sm';
      case 'md':
      default:
        return 'px-2.5 py-1 text-xs';
    }
  };

  // Get icon size based on badge size
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 16;
      case 'md':
      default:
        return 14;
    }
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${getBgColor()} ${getSizeClasses()}`}
    >
      {showIcon && (
        <SafeIcon 
          icon={getRoleIcon()} 
          size={getIconSize()} 
          className={showLabel ? 'mr-1.5' : ''}
        />
      )}
      {showLabel && roleName}
    </span>
  );
};

RoleBadge.propTypes = {
  role: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showIcon: PropTypes.bool,
  showLabel: PropTypes.bool
};

export default RoleBadge;