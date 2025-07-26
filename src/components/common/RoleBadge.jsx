import React from 'react';
import { RoleManager } from '../../services/RoleManager';

const RoleBadge = ({ role, showTooltip = true, size = 'sm' }) => {
  const badge = RoleManager.getRoleBadge(role);
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  if (showTooltip) {
    return (
      <div className="relative group">
        <span className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium border ${badge.color}`}>
          {badge.label}
        </span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
          {badge.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium border ${badge.color}`}>
      {badge.label}
    </span>
  );
};

export default RoleBadge;