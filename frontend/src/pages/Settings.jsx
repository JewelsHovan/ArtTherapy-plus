import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { painPlusAPI } from '../services/api';

const Settings = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState({ textSize: 50 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await painPlusAPI.user.getProfile();
      const userSettings = response.data.profile?.settings || {};
      setSettings({
        textSize: userSettings.textSize ?? 50,
        ...userSettings
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setIsSaving(true);

    try {
      await painPlusAPI.user.updateProfile({ settings: newSettings });
    } catch (err) {
      console.error('Failed to save setting:', err);
      // Revert on failure
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextSizeChange = (e) => {
    const size = parseInt(e.target.value);
    updateSetting('textSize', size);
  };

  const categories = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'accessibility', label: 'Accessibility', icon: '♿' },
    { id: 'language', label: 'Language', icon: '🌐' },
    { id: 'privacy', label: 'Privacy Settings', icon: '🔒' },
  ];

  const settingsOptions = {
    general: [
      'Text Size',
      'Language',
      'Colourblind friendly themes',
      'Text-to-Speech',
      'Speech-to-Text',
      'Link to Bluetooth-enabled devices'
    ],
    accessibility: [
      'High Contrast Mode',
      'Large Text',
      'Screen Reader Support',
      'Keyboard Navigation'
    ],
    language: [
      'English',
      'Spanish',
      'French',
      'German'
    ],
    privacy: [
      'Data Collection',
      'Analytics',
      'Third-party Sharing',
      'Account Privacy'
    ]
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 bg-white border-r border-gray-200 p-6">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <nav className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                selectedCategory === category.id
                  ? 'bg-gray-100 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-8">
        {/* User Info Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full overflow-hidden">
                <img 
                  src="https://via.placeholder.com/64" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium">Username</h3>
                <p className="text-sm text-gray-600">Verified Account</p>
              </div>
              <button 
                onClick={() => navigate('/profile')}
                className="text-blue-600 hover:underline text-sm"
              >
                Edit profile
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <span>🔽</span>
            <span>Filter</span>
          </button>
        </div>

        {/* Settings Options */}
        <div className="space-y-6">
          {selectedCategory === 'general' && (
            <>
              {/* Text Size Slider */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Text Size</h3>
                  {isSaving && <span className="text-xs text-gray-500">Saving...</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">A</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.textSize}
                      onChange={handleTextSizeChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full pointer-events-none"
                      style={{ left: `calc(${settings.textSize}% - 12px)` }}
                    />
                  </div>
                  <span className="text-xl">A</span>
                </div>
              </div>

              {/* Other Settings */}
              {settingsOptions[selectedCategory].slice(1).map((option, index) => (
                <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium">{option}</h3>
                </div>
              ))}
            </>
          )}

          {selectedCategory !== 'general' && (
            settingsOptions[selectedCategory].map((option, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium">{option}</h3>
                <p className="text-gray-600 mt-2">Placeholder content for {option}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;