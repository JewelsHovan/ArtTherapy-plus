/**
 * Handler exports
 *
 * Re-exports all handlers for convenient importing.
 */

// Auth handlers
export {
  handleMicrosoftCallback,
  handleSignup,
  handleLogin,
  handleVerifyToken,
  handleLogout,
} from './auth.js';

// Gallery handlers
export {
  handleSaveGalleryItem,
  handleGetGalleryItems,
  handleDeleteGalleryItem,
} from './gallery.js';

// Journal handlers
export {
  handleCreateJournalEntry,
  handleGetJournalEntries,
} from './journal.js';

// User handlers
export {
  handleGetProfile,
  handleUpdateProfile,
  handleUploadAvatar,
} from './user.js';

// Generation handlers
export {
  handleGenerateImage,
  handleGeneratePrompt,
  handleReflect,
  handleInspire,
  handleEditImage,
} from './generate.js';
