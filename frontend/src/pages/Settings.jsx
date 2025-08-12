import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [textSize, setTextSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6">
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
      <div className="flex-1 p-8">
        {/* Header with Profile */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-300 rounded-full overflow-hidden">
              <img 
                src="https://via.placeholder.com/80" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Hello, [Username]!</h2>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-500">✓</span>
                  <span>Verified with Third-Party Authentication</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">🏆</span>
                  <span>First Spark</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <span className="text-yellow-500">🏆</span>
                  <span>Congrats on completing your first creative session!</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => navigate('/profile')}
              className="text-blue-600 hover:underline text-sm"
            >
              Edit profile
            </button>
            <button className="text-blue-600 hover:underline text-sm">
              Export data to care provider
            </button>
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
                <h3 className="text-lg font-medium mb-4">Text Size</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm">A</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={textSize}
                      onChange={(e) => setTextSize(e.target.value)}
                      className="w-full"
                    />
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full"
                      style={{ left: `${textSize}%` }}
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