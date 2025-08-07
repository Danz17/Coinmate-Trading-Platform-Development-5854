import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Tooltip Component
 * Displays a tooltip when hovering over children
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Element to attach tooltip to
 * @param {string} props.content - Tooltip content
 * @param {string} props.position - Tooltip position ('top', 'bottom', 'left', 'right')
 * @param {string} props.variant - Tooltip variant ('dark', 'light')
 * @param {number} props.delay - Delay before showing tooltip (ms)
 * @returns {React.ReactElement} - Rendered tooltip
 */
const Tooltip = ({ children, content, position = 'top', variant = 'dark', delay = 300 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const childRef = useRef(null);
  const tooltipRef = useRef(null);
  const timerRef = useRef(null);

  // Get position classes
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          x: '-50%',
          y: '-100%',
          bottom: '100%',
          left: '50%',
          marginBottom: '5px'
        };
      case 'bottom':
        return {
          x: '-50%',
          y: '0%',
          top: '100%',
          left: '50%',
          marginTop: '5px'
        };
      case 'left':
        return {
          x: '-100%',
          y: '-50%',
          top: '50%',
          right: '100%',
          marginRight: '5px'
        };
      case 'right':
        return {
          x: '0%',
          y: '-50%',
          top: '50%',
          left: '100%',
          marginLeft: '5px'
        };
      default:
        return {
          x: '-50%',
          y: '-100%',
          bottom: '100%',
          left: '50%',
          marginBottom: '5px'
        };
    }
  };

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'light':
        return 'bg-white text-gray-800 border border-gray-200 shadow-md';
      case 'dark':
      default:
        return 'bg-gray-900 text-white';
    }
  };

  // Calculate arrow position
  const getArrowStyles = () => {
    switch (position) {
      case 'top':
        return {
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderRight: variant === 'light' ? '1px solid #e5e7eb' : 'none',
          borderBottom: variant === 'light' ? '1px solid #e5e7eb' : 'none'
        };
      case 'bottom':
        return {
          top: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderLeft: variant === 'light' ? '1px solid #e5e7eb' : 'none',
          borderTop: variant === 'light' ? '1px solid #e5e7eb' : 'none'
        };
      case 'left':
        return {
          right: '-4px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderTop: variant === 'light' ? '1px solid #e5e7eb' : 'none',
          borderRight: variant === 'light' ? '1px solid #e5e7eb' : 'none'
        };
      case 'right':
        return {
          left: '-4px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderLeft: variant === 'light' ? '1px solid #e5e7eb' : 'none',
          borderBottom: variant === 'light' ? '1px solid #e5e7eb' : 'none'
        };
      default:
        return {
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderRight: variant === 'light' ? '1px solid #e5e7eb' : 'none',
          borderBottom: variant === 'light' ? '1px solid #e5e7eb' : 'none'
        };
    }
  };

  // Animation variants
  const tooltipVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  };

  // Show tooltip
  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  // Hide tooltip
  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsVisible(false);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Adjust position for viewport edges
  useEffect(() => {
    if (isVisible && childRef.current && tooltipRef.current) {
      const childRect = childRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Calculate position to keep tooltip in viewport
      let adjustedPosition = { ...tooltipPosition };
      
      // Adjust horizontal position
      if (position === 'top' || position === 'bottom') {
        if (childRect.left + (childRect.width / 2) - (tooltipRect.width / 2) < 0) {
          adjustedPosition.x = -childRect.left + 10;
        } else if (childRect.right - (childRect.width / 2) + (tooltipRect.width / 2) > window.innerWidth) {
          adjustedPosition.x = window.innerWidth - childRect.right - 10;
        }
      }
      
      // Adjust vertical position
      if (position === 'left' || position === 'right') {
        if (childRect.top + (childRect.height / 2) - (tooltipRect.height / 2) < 0) {
          adjustedPosition.y = -childRect.top + 10;
        } else if (childRect.bottom - (childRect.height / 2) + (tooltipRect.height / 2) > window.innerHeight) {
          adjustedPosition.y = window.innerHeight - childRect.bottom - 10;
        }
      }
      
      setTooltipPosition(adjustedPosition);
    }
  }, [isVisible, position]);

  return (
    <div 
      className="inline-block relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      ref={childRef}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            className={`absolute z-50 max-w-xs px-2.5 py-1.5 rounded text-sm whitespace-normal ${getVariantClasses()}`}
            style={getPositionStyles()}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={tooltipVariants}
            transition={{ duration: 0.15 }}
            ref={tooltipRef}
          >
            {content}
            <span 
              className={`absolute w-2 h-2 ${variant === 'light' ? 'bg-white' : 'bg-gray-900'}`} 
              style={getArrowStyles()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  variant: PropTypes.oneOf(['dark', 'light']),
  delay: PropTypes.number
};

export default Tooltip;