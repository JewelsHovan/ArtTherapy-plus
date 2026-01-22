import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { painPlusAPI } from '../services/api';
import TextInput from '../components/forms/TextInput';
import SelectInput from '../components/forms/SelectInput';
import TagInput from '../components/forms/TagInput';
import AvatarUploader from '../components/forms/AvatarUploader';
import LoadingButton from '../components/common/LoadingButton';
import ConfirmDialog from '../components/common/ConfirmDialog';

// Constants for dropdown options
const SEX_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Intersex', label: 'Intersex' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

const RELATIONSHIP_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'Single', label: 'Single' },
  { value: 'In a relationship', label: 'In a relationship' },
  { value: 'Married', label: 'Married' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

const ACTIVITY_LEVEL_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'Sedentary', label: 'Sedentary' },
  { value: 'Lightly Active', label: 'Lightly Active' },
  { value: 'Moderately Active', label: 'Moderately Active' },
  { value: 'Very Active', label: 'Very Active' },
  { value: 'Extremely Active', label: 'Extremely Active' },
];

const LANGUAGE_SUGGESTIONS = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese',
  'Korean',
  'Portuguese',
  'Italian',
  'Russian',
  'Arabic',
  'Hindi',
];

const SYMPTOM_SUGGESTIONS = [
  'Chronic Pain',
  'Back Pain',
  'Headaches',
  'Migraines',
  'Joint Pain',
  'Fibromyalgia',
  'Arthritis',
  'Neuropathy',
  'Muscle Pain',
  'Anxiety',
  'Depression',
  'Stress',
  'Insomnia',
  'Fatigue',
];

const Profile = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  // Deep comparison to check if profile has been modified
  const isDirty = useCallback(() => {
    if (!profile || !editedProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(editedProfile);
  }, [profile, editedProfile]);

  // Validate age range
  const validateAge = (age) => {
    if (age === null || age === undefined || age === '') return null;
    const numAge = Number(age);
    if (isNaN(numAge)) return 'Age must be a number';
    if (numAge < 1 || numAge > 120) return 'Age must be between 1 and 120';
    return null;
  };

  // Enter edit mode
  const handleEditClick = () => {
    setEditedProfile(structuredClone(profile));
    setValidationErrors({});
    setIsEditing(true);
  };

  // Exit edit mode
  const exitEditMode = () => {
    setIsEditing(false);
    setEditedProfile(null);
    setValidationErrors({});
    setShowDiscardConfirm(false);
  };

  // Cancel with confirmation if dirty
  const handleCancelClick = () => {
    if (isDirty()) {
      setShowDiscardConfirm(true);
    } else {
      exitEditMode();
    }
  };

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear field error when changed
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Save profile changes
  const handleSave = async () => {
    // Validate age
    const ageError = validateAge(editedProfile.age);
    if (ageError) {
      setValidationErrors({ age: ageError });
      return;
    }

    setIsSaving(true);
    try {
      // Build updates object with only changed fields
      const updates = {};
      const fieldsToCheck = [
        'name',
        'age',
        'sex',
        'gender',
        'symptoms',
        'location',
        'languages',
        'occupation',
        'relationship_status',
        'prescriptions',
        'activity_level',
      ];

      for (const field of fieldsToCheck) {
        const original = profile[field];
        const edited = editedProfile[field];
        // Deep compare for arrays
        if (JSON.stringify(original) !== JSON.stringify(edited)) {
          updates[field] = edited;
        }
      }

      if (Object.keys(updates).length === 0) {
        toast.success('No changes to save');
        exitEditMode();
        return;
      }

      const response = await painPlusAPI.user.updateProfile(updates);
      setProfile(response.data.profile);
      toast.success('Profile updated successfully');
      exitEditMode();
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (processedImage) => {
    setIsUploadingAvatar(true);
    try {
      const response = await painPlusAPI.user.uploadAvatar(processedImage.data);
      const newAvatarUrl = response.data.avatar_url;

      // Update both profile and editedProfile with new avatar_url
      setProfile((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
      if (editedProfile) {
        setEditedProfile((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
      }
      toast.success('Profile photo updated');
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle avatar upload error
  const handleAvatarError = (errorMessage) => {
    toast.error(errorMessage);
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isEditing && isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, isDirty]);

  // Profile fields for view mode
  const profileFields = profile
    ? [
        { label: 'Sex', value: profile.sex || 'Not specified', field: 'sex' },
        { label: 'Gender', value: profile.gender || 'Not specified', field: 'gender' },
        { label: 'Age', value: profile.age || 'Not specified', field: 'age' },
        {
          label: 'Symptoms',
          value:
            Array.isArray(profile.symptoms) && profile.symptoms.length > 0
              ? profile.symptoms.join(', ')
              : 'None specified',
          field: 'symptoms',
        },
        { label: 'Location', value: profile.location || 'Not specified', field: 'location' },
        {
          label: 'Languages spoken',
          value:
            Array.isArray(profile.languages) && profile.languages.length > 0
              ? profile.languages.join(', ')
              : 'Not specified',
          field: 'languages',
        },
        { label: 'Occupation', value: profile.occupation || 'Not specified', field: 'occupation' },
        {
          label: 'Relationship status',
          value: profile.relationship_status || 'Not specified',
          field: 'relationship_status',
        },
        {
          label: 'Prescriptions',
          value:
            Array.isArray(profile.prescriptions) && profile.prescriptions.length > 0
              ? profile.prescriptions.join(', ')
              : 'None',
          field: 'prescriptions',
        },
        {
          label: 'Activity level',
          value: profile.activity_level || 'Not specified',
          field: 'activity_level',
        },
      ]
    : [];

  // Filter profile fields based on search query
  const filteredFields = profileFields.filter(
    (field) =>
      field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (field.value && field.value.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Clear search handler
  const clearSearch = () => setSearchQuery('');

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
          <button
            onClick={loadProfile}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
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
        {/* Search bar (only in view mode) */}
        {!isEditing && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar - show uploader in edit mode */}
            {isEditing ? (
              <AvatarUploader
                currentAvatarUrl={editedProfile?.avatar_url}
                userName={editedProfile?.name}
                onUpload={handleAvatarUpload}
                onError={handleAvatarError}
                isLoading={isUploadingAvatar}
                size="medium"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary text-white text-3xl font-bold">
                    {profile?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <TextInput
                  name="name"
                  value={editedProfile?.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Your name"
                  fullWidth
                />
              ) : (
                <>
                  <h3 className="text-lg font-medium truncate">
                    {profile?.name || 'User'}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-primary">&#10003;</span> Verified
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Edit / Save / Cancel buttons */}
          {isEditing ? (
            <div className="flex gap-3">
              <LoadingButton
                onClick={handleSave}
                isLoading={isSaving}
                loadingText="Saving..."
                variant="primary"
                fullWidth
              >
                Save Changes
              </LoadingButton>
              <LoadingButton
                onClick={handleCancelClick}
                variant="secondary"
                disabled={isSaving}
              >
                Cancel
              </LoadingButton>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleEditClick}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="py-2 px-4 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                Settings
              </button>
            </div>
          )}
        </div>

        {/* Profile fields - Edit mode */}
        {isEditing ? (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Personal Information
            </h2>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                name="age"
                label="Age"
                value={editedProfile?.age?.toString() || ''}
                onChange={(e) =>
                  handleFieldChange(
                    'age',
                    e.target.value ? parseInt(e.target.value, 10) || '' : ''
                  )
                }
                placeholder="Enter your age"
                error={validationErrors.age}
                fullWidth
              />
              <SelectInput
                name="sex"
                label="Sex"
                value={editedProfile?.sex || ''}
                onChange={(e) => handleFieldChange('sex', e.target.value)}
                options={SEX_OPTIONS}
                placeholder="Select..."
                fullWidth
              />
              <TextInput
                name="gender"
                label="Gender"
                value={editedProfile?.gender || ''}
                onChange={(e) => handleFieldChange('gender', e.target.value)}
                placeholder="Enter your gender"
                fullWidth
              />
              <SelectInput
                name="relationship_status"
                label="Relationship Status"
                value={editedProfile?.relationship_status || ''}
                onChange={(e) => handleFieldChange('relationship_status', e.target.value)}
                options={RELATIONSHIP_OPTIONS}
                placeholder="Select..."
                fullWidth
              />
            </div>

            {/* Location & Occupation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                name="location"
                label="Location"
                value={editedProfile?.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                placeholder="City, Country"
                fullWidth
              />
              <TextInput
                name="occupation"
                label="Occupation"
                value={editedProfile?.occupation || ''}
                onChange={(e) => handleFieldChange('occupation', e.target.value)}
                placeholder="Your occupation"
                fullWidth
              />
            </div>

            {/* Activity Level */}
            <SelectInput
              name="activity_level"
              label="Activity Level"
              value={editedProfile?.activity_level || ''}
              onChange={(e) => handleFieldChange('activity_level', e.target.value)}
              options={ACTIVITY_LEVEL_OPTIONS}
              placeholder="Select..."
              fullWidth
            />

            {/* Languages */}
            <TagInput
              name="languages"
              label="Languages Spoken"
              value={editedProfile?.languages || []}
              onChange={(newValue) => handleFieldChange('languages', newValue)}
              suggestions={LANGUAGE_SUGGESTIONS}
              placeholder="Type a language and press Enter"
              maxTags={10}
              fullWidth
            />

            {/* Health Information */}
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">
              Health Information
            </h2>

            <TagInput
              name="symptoms"
              label="Symptoms"
              value={editedProfile?.symptoms || []}
              onChange={(newValue) => handleFieldChange('symptoms', newValue)}
              suggestions={SYMPTOM_SUGGESTIONS}
              placeholder="Type a symptom and press Enter"
              maxTags={15}
              fullWidth
            />

            <TagInput
              name="prescriptions"
              label="Prescriptions"
              value={editedProfile?.prescriptions || []}
              onChange={(newValue) => handleFieldChange('prescriptions', newValue)}
              suggestions={[]}
              placeholder="Type a prescription and press Enter"
              maxTags={20}
              fullWidth
            />
          </div>
        ) : (
          /* Profile fields - View mode */
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
            {filteredFields.length > 0 ? (
              filteredFields.map((field, index) => (
                <div key={index} className="flex justify-between items-center p-4">
                  <span className="text-gray-600">{field.label}</span>
                  <span className="text-gray-900 text-right max-w-[60%] truncate">
                    {field.value}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No results found for &quot;{searchQuery}&quot;</p>
                <button onClick={clearSearch} className="mt-2 text-primary hover:underline">
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Discard Changes Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={exitEditMode}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="warning"
      />
    </div>
  );
};

export default Profile;
