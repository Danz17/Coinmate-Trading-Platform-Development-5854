import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { AppStateManager } from '../../services/AppStateManager';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '@/components/common/SafeIcon';

const ResponsiveGridLayout = WidthProvider(Responsive);

const Dashboard = () => {
  const [layouts, setLayouts] = useState({
    lg: [
      { i: 'balances', x: 0, y: 0, w: 6, h: 4 },
      { i: 'recentTransactions', x: 6, y: 0, w: 6, h: 4 },
      { i: 'marketTrends', x: 0, y: 4, w: 8, h: 4 },
      { i: 'notifications', x: 8, y: 4, w: 4, h: 4 }
    ],
    md: [
      { i: 'balances', x: 0, y: 0, w: 6, h: 4 },
      { i: 'recentTransactions', x: 6, y: 0, w: 6, h: 4 },
      { i: 'marketTrends', x: 0, y: 4, w: 12, h: 4 },
      { i: 'notifications', x: 0, y: 8, w: 12, h: 4 }
    ],
    sm: [
      { i: 'balances', x: 0, y: 0, w: 12, h: 4 },
      { i: 'recentTransactions', x: 0, y: 4, w: 12, h: 4 },
      { i: 'marketTrends', x: 0, y: 8, w: 12, h: 4 },
      { i: 'notifications', x: 0, y: 12, w: 12, h: 4 }
    ]
  });
  
  const [userData, setUserData] = useState({
    balances: {
      total: 15750.25,
      currency: 'USD',
      assets: [
        { name: 'USD', amount: 5250.75, symbol: '$' },
        { name: 'EUR', amount: 3500, symbol: '€' },
        { name: 'BTC', amount: 0.12, symbol: '₿' },
        { name: 'ETH', amount: 2.5, symbol: 'Ξ' }
      ]
    },
    recentTransactions: [
      { id: 1, type: 'buy', asset: 'BTC', amount: 0.05, value: 2500, date: '2023-11-10T14:30:00' },
      { id: 2, type: 'sell', asset: 'ETH', amount: 1.2, value: 2100, date: '2023-11-09T11:15:00' },
      { id: 3, type: 'transfer', asset: 'USD', amount: 1000, value: 1000, date: '2023-11-08T09:45:00' }
    ],
    marketTrends: [
      { asset: 'BTC', price: 50000, change: 2.5 },
      { asset: 'ETH', price: 1800, change: -1.2 },
      { asset: 'XRP', price: 0.65, change: 5.3 },
      { asset: 'ADA', price: 1.25, change: 3.7 }
    ],
    notifications: [
      { id: 1, message: 'Your BTC purchase is complete', read: false, date: '2023-11-10T14:35:00' },
      { id: 2, message: 'Price alert: ETH is down 5% in 24h', read: true, date: '2023-11-09T22:15:00' },
      { id: 3, message: 'System maintenance scheduled for Nov 12', read: false, date: '2023-11-08T10:00:00' }
    ]
  });
  
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Update app state
    AppStateManager.setSelectedTab('dashboard');
    
    // Load saved layouts if available
    const savedLayouts = localStorage.getItem('dashboardLayouts');
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts));
      } catch (error) {
        console.error('Error loading saved layouts:', error);
      }
    }
    
    // Load user data
    const loadUserData = async () => {
      try {
        // In a real app, this would come from an API
        // const data = await AppStateManager.getUserDashboardData();
        // setUserData(data);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Save layouts when they change
  const handleLayoutChange = (_, allLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem('dashboardLayouts', JSON.stringify(allLayouts));
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Reset layouts to default
  const resetLayouts = () => {
    localStorage.removeItem('dashboardLayouts');
    setLayouts({
      lg: [
        { i: 'balances', x: 0, y: 0, w: 6, h: 4 },
        { i: 'recentTransactions', x: 6, y: 0, w: 6, h: 4 },
        { i: 'marketTrends', x: 0, y: 4, w: 8, h: 4 },
        { i: 'notifications', x: 8, y: 4, w: 4, h: 4 }
      ],
      md: [
        { i: 'balances', x: 0, y: 0, w: 6, h: 4 },
        { i: 'recentTransactions', x: 6, y: 0, w: 6, h: 4 },
        { i: 'marketTrends', x: 0, y: 4, w: 12, h: 4 },
        { i: 'notifications', x: 0, y: 8, w: 12, h: 4 }
      ],
      sm: [
        { i: 'balances', x: 0, y: 0, w: 12, h: 4 },
        { i: 'recentTransactions', x: 0, y: 4, w: 12, h: 4 },
        { i: 'marketTrends', x: 0, y: 8, w: 12, h: 4 },
        { i: 'notifications', x: 0, y: 12, w: 12, h: 4 }
      ]
    });
  };

  // Render widget based on ID
  const renderWidget = (id) => {
    switch (id) {
      case 'balances':
        return (
          <div className="h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Balances</h2>
              <span className="text-2xl font-bold">${userData.balances.total.toLocaleString()}</span>
            </div>
            <div className="space-y-3">
              {userData.balances.assets.map((asset, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="font-medium">{asset.name}</div>
                  <div className="font-semibold">{asset.symbol}{asset.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'recentTransactions':
        return (
          <div className="h-full overflow-hidden">
            <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
            <div className="space-y-3 overflow-y-auto max-h-[calc(100%-2rem)]">
              {userData.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="flex items-center">
                      {tx.type === 'buy' && (
                        <SafeIcon icon={FiIcons.FiArrowDown} className="text-green-500 mr-2" />
                      )}
                      {tx.type === 'sell' && (
                        <SafeIcon icon={FiIcons.FiArrowUp} className="text-red-500 mr-2" />
                      )}
                      {tx.type === 'transfer' && (
                        <SafeIcon icon={FiIcons.FiRepeat} className="text-blue-500 mr-2" />
                      )}
                      <span className="font-medium capitalize">{tx.type}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {tx.amount} {tx.asset}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${tx.value.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'marketTrends':
        return (
          <div className="h-full overflow-hidden">
            <h2 className="text-lg font-semibold mb-4">Market Trends</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {userData.marketTrends.map((asset, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="font-medium">{asset.asset}</div>
                  <div className="text-lg font-semibold">${asset.price.toLocaleString()}</div>
                  <div className={`text-sm ${asset.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {asset.change >= 0 ? '+' : ''}{asset.change}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="h-full overflow-hidden">
            <h2 className="text-lg font-semibold mb-4">Notifications</h2>
            <div className="space-y-3 overflow-y-auto max-h-[calc(100%-2rem)]">
              {userData.notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-2 rounded flex items-start ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                >
                  <div className="mr-2 mt-0.5">
                    {!notification.read ? (
                      <SafeIcon icon={FiIcons.FiBell} className="text-blue-500" />
                    ) : (
                      <SafeIcon icon={FiIcons.FiCheckCircle} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{notification.message}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(notification.date).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return <div>Unknown widget</div>;
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={toggleEditMode}
            className="px-3 py-1.5 rounded-md bg-blue-500 text-white flex items-center"
          >
            <SafeIcon icon={isEditing ? FiIcons.FiCheck : FiIcons.FiEdit} className="mr-1.5" />
            {isEditing ? 'Save Layout' : 'Edit Layout'}
          </button>
          {isEditing && (
            <button
              onClick={resetLayouts}
              className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-700 flex items-center"
            >
              <SafeIcon icon={FiIcons.FiRefreshCw} className="mr-1.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 1, xxs: 1 }}
        rowHeight={80}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
        margin={[16, 16]}
      >
        <div key="balances" className="bg-white p-4 rounded-lg shadow-sm">
          {renderWidget('balances')}
        </div>
        <div key="recentTransactions" className="bg-white p-4 rounded-lg shadow-sm">
          {renderWidget('recentTransactions')}
        </div>
        <div key="marketTrends" className="bg-white p-4 rounded-lg shadow-sm">
          {renderWidget('marketTrends')}
        </div>
        <div key="notifications" className="bg-white p-4 rounded-lg shadow-sm">
          {renderWidget('notifications')}
        </div>
      </ResponsiveGridLayout>
    </div>
  );
};

export default Dashboard;