import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { painPlusAPI } from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await painPlusAPI.user.getProfile();
      setProfile(response.data.profile);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const profileFields = profile ? [
    { label: 'Sex', value: profile.sex || 'Not specified' },
    { label: 'Gender', value: profile.gender || 'Not specified' },
    { label: 'Age', value: profile.age || 'Not specified' },
    { label: 'Symptoms', value: Array.isArray(profile.symptoms) && profile.symptoms.length > 0
      ? profile.symptoms.join(', ')
      : 'None specified' },
    { label: 'Location', value: profile.location || 'Not specified' },
    { label: 'Languages spoken', value: Array.isArray(profile.languages) && profile.languages.length > 0
      ? profile.languages.join(', ')
      : 'Not specified' },
    { label: 'Occupation', value: profile.occupation || 'Not specified' },
    { label: 'Relationship status', value: profile.relationship_status || 'Not specified' },
    { label: 'Prescriptions', value: Array.isArray(profile.prescriptions) && profile.prescriptions.length > 0
      ? profile.prescriptions.join(', ')
      : 'None' },
    { label: 'Activity level', value: profile.activity_level || 'Not specified' },
  ] : [];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadProfile} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold">Profile</h1>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 bg-white border-r border-gray-200 p-6">
        <h1 className="text-2xl font-bold mb-8">Profile</h1>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 lg:p-8">
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-white text-2xl font-bold">
                  {profile?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium truncate">{profile?.name || 'User'}</h3>
              <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <span className="text-blue-500">✓</span> Verified
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/settings')}
            className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Manage Subscription
          </button>
        </div>

        {/* Profile fields */}
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {profileFields.map((field, index) => (
            <div key={index} className="flex justify-between items-center p-4">
              <span className="text-gray-600">{field.label}</span>
              <span className="text-gray-900 text-right max-w-[60%] truncate">{field.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
