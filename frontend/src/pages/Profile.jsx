import { useState } from 'react';

const Profile = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const profileFields = [
    { label: 'Sex', value: 'Prefer not to say' },
    { label: 'Gender', value: 'Not specified' },
    { label: 'Age', value: '25' },
    { label: 'Symptoms', value: 'Chronic back pain, anxiety' },
    { label: 'Location', value: 'Toronto, Canada' },
    { label: 'Languages spoken', value: 'English, French' },
    { label: 'Occupation', value: 'Software Developer' },
    { label: 'Relationship status', value: 'Single' },
    { label: 'Prescriptions', value: 'Ibuprofen 400mg' },
    { label: 'Activity level', value: 'Moderate' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6">
        <h1 className="text-2xl font-bold mb-8">Profile</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 pt-20">
        {/* Profile Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">My Profile</h2>
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
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <span className="text-blue-500">✓</span> Verified
                  </span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <span className="text-yellow-500">🏆</span> First Spark
                  </span>
                </div>
              </div>
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

        {/* Profile Fields */}
        <div className="space-y-4">
          {profileFields.map((field, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm text-gray-600">{field.label}</h3>
                  <p className="text-lg mt-1">{field.value}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          {/* Manage Subscription */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mt-6">
            <button className="text-lg text-blue-600 hover:underline">
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;