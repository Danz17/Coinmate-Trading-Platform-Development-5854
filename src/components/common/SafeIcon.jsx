import React from 'react';

export default function SafeIcon({ icon, size = 20, color = 'currentColor', className = '', ...props }) {
  if (!icon) {
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
        aria-hidden="true" 
        {...props}
      >
        <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  
  try {
    const IconComponent = typeof icon === 'function' ? icon : icon.type;
    
    return (
      <span className={`inline-flex items-center justify-center ${className}`} {...props}>
        {React.createElement(IconComponent, {
          size,
          className: 'icon',
          'aria-hidden': 'true',
          ...props
        })}
      </span>
    );
  } catch (error) {
    console.error('Error rendering icon:', error);
    
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
        aria-hidden="true" 
        {...props}
      >
        <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
}