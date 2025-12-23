import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { painPlusAPI } from '../services/api';
import { CardSkeleton } from '../components/common/Skeleton';

const Journal = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadJournal();
  }, []);

  const loadJournal = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await painPlusAPI.journal.getAll();
      setEntries(response.data.entries || []);
    } catch (err) {
      console.error('Failed to load journal:', err);
      setError('Failed to load your journal entries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="card-clean mb-8 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadJournal}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card-clean mb-8 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Journal</h1>
              <p className="text-gray-600">Your reflection entries and insights</p>
            </div>
            <button
              onClick={() => navigate('/mode')}
              className="px-4 py-2 bg-primary text-white rounded-lg
                hover:bg-primary-hover transition-all duration-300 font-medium shadow-md"
            >
              New Entry
            </button>
          </div>
        </div>

        {/* Empty State */}
        {entries.length === 0 ? (
          <div className="card-clean p-12 text-center animate-fadeIn" style={{ animationDelay: '150ms' }}>
            <div className="max-w-md mx-auto">
              <svg
                className="w-24 h-24 mx-auto text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No Journal Entries Yet</h2>
              <p className="text-gray-500 mb-6">
                Begin your reflection journey by creating artwork and capturing your thoughts
              </p>
              <button
                onClick={() => navigate('/mode')}
                className="px-6 py-3 bg-secondary text-white rounded-lg
                  hover:bg-secondary-hover transition-all duration-300 font-medium shadow-md"
              >
                New Entry
              </button>
            </div>
          </div>
        ) : (
          /* Entry List */
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="card-clean p-6 animate-fadeIn hover:shadow-lg transition-shadow duration-300"
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {entry.gallery_image_url && (
                    <div className="flex-shrink-0">
                      <img
                        src={entry.gallery_image_url}
                        alt="Linked artwork"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-gray-500">{formatDate(entry.created_at)}</p>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {truncateText(entry.reflection_text)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Entry Count */}
        {entries.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} in your journal
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
