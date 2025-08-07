import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '@/components/common/SafeIcon';
import { SupabaseService } from '../../services/SupabaseService';

const OrganizationSelector = ({ organizations = [], onSelect }) => {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        if (organizations.length === 0) {
          const fetchedOrgs = await SupabaseService.getOrganizations();
          setOrgs(fetchedOrgs);
        } else {
          setOrgs(organizations);
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
        setError('Failed to load organizations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [organizations]);

  if (loading) {
    return (
      <div className="text-center p-8">
        <SafeIcon icon={FiIcons.FiLoader} className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Loading Organizations...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 max-w-md mx-auto">
        <SafeIcon icon={FiIcons.FiAlertTriangle} className="text-4xl text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div className="text-center p-8 max-w-md mx-auto">
        <SafeIcon icon={FiIcons.FiAlertCircle} className="text-4xl text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Organizations Available</h2>
        <p className="text-gray-600 mb-4">
          You don't have access to any organizations. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to BaryaBazaar</h1>
        <p className="text-gray-600">Select an organization to continue</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgs.map((org) => (
          <motion.div
            key={org.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelect(org)}
          >
            <div className="p-6">
              <div className="flex items-center justify-center mb-4 h-20">
                {org.logo_url ? (
                  <img 
                    src={org.logo_url} 
                    alt={`${org.name} Logo`}
                    className="max-h-full max-w-full object-contain" 
                  />
                ) : (
                  <div 
                    className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ 
                      backgroundColor: org.primary_color || '#3B82F6',
                    }}
                  >
                    {org.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-800 mb-2">{org.name}</h3>
              <div className="flex justify-center">
                <button
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(org);
                  }}
                >
                  Select
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OrganizationSelector;