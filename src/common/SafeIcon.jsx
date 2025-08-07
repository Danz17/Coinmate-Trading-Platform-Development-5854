import React from 'react';
import PropTypes from 'prop-types';

/**
 * Safe Icon Component
 * Safely renders React icons with error handling and fallback
 * 
 * @param {Object} props - Component props
 * @param {Function|Object} props.icon - Icon component from react-icons
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.size - Icon size in pixels
 * @param {Object} props.style - Additional inline styles
 * @returns {React.ReactElement} - Rendered icon
 */
const SafeIcon = ({ icon, className, size, style, ...rest }) => {
  // If no icon is provided, return null
  if (!icon) {
    console.warn('SafeIcon: No icon provided');
    return null;
  }

  try {
    // Determine if icon is a component or a function
    const IconComponent = typeof icon === 'function' ? icon : icon.type;
    
    // Create style object with size if provided
    const iconStyle = {
      ...style,
      ...(size ? { fontSize: `${size}px` } : {})
    };

    // Render the icon
    return (
      <span className={`inline-flex items-center justify-center ${className || ''}`} style={iconStyle} {...rest}>
        {React.createElement(IconComponent, {
          size,
          className: 'icon',
          'aria-hidden': 'true',
          ...rest
        })}
      </span>
    );
  } catch (error) {
    console.error('Error rendering icon:', error);
    
    // Fallback to a basic square as placeholder
    return (
      <span 
        className={`inline-block bg-gray-200 ${className || ''}`}
        style={{ 
          width: size || '1em', 
          height: size || '1em',
          ...style
        }}
        {...rest}
      />
    );
  }
};

SafeIcon.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  className: PropTypes.string,
  size: PropTypes.number,
  style: PropTypes.object
};

export default SafeIcon;