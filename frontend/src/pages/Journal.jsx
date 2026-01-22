import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { painPlusAPI } from '../services/api';
import { CardSkeleton } from '../components/common/Skeleton';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';

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
      <div className="min-h-screen watercolor-bg p-4 sm:p-6 md:p-8">
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
      <div className="min-h-screen watercolor-bg p-4 sm:p-6 md:p-8">
        <ErrorMessage message={error} onRetry={loadJournal} variant="page" />
      </div>
    );
  }

  const JournalIcon = () => (
    <svg
      className="w-12 h-12 text-primary/60"
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
  );

  return (
    <div className="min-h-screen watercolor-bg p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Journal"
          description="Your reflection entries and insights"
          actions={
            <button
              onClick={() => navigate('/mode')}
              className="px-4 py-2 bg-primary text-white rounded-lg
                hover:bg-primary/90 transition-all duration-200 font-medium shadow-md"
            >
              New Entry
            </button>
          }
        />

        {/* Empty State */}
        {entries.length === 0 ? (
          <div className="card-clean animate-fadeIn" style={{ animationDelay: '150ms' }}>
            <EmptyState
              icon={<JournalIcon />}
              title="No Journal Entries Yet"
              description="Begin your reflection journey by creating artwork and capturing your thoughts"
              action={
                <button
                  onClick={() => navigate('/mode')}
                  className="px-6 py-3 bg-secondary text-white rounded-lg
                    hover:bg-secondary/90 transition-all duration-200 font-medium shadow-md"
                >
                  New Entry
                </button>
              }
            />
          </div>
        ) : (
          /* Entry List */
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="card-clean p-6 animate-fadeIn hover:shadow-lg transition-shadow duration-200"
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
