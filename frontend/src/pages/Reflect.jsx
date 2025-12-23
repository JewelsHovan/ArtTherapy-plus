import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { painPlusAPI } from '../services/api';
import Button from '../components/common/Button';

const Reflect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const galleryItem = location.state?.galleryItem;

  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);

  const loadReflectionQuestions = useCallback(async () => {
    if (!galleryItem) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await painPlusAPI.reflect(
        galleryItem.description,
        galleryItem.promptUsed || ''
      );
      setQuestions(response.questions || []);
      // Initialize responses object
      const initialResponses = {};
      (response.questions || []).forEach((_, idx) => {
        initialResponses[idx] = '';
      });
      setResponses(initialResponses);
    } catch (err) {
      console.error('Failed to load reflection questions:', err);
      setError('Failed to generate reflection questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [galleryItem]);

  useEffect(() => {
    if (!galleryItem) {
      navigate('/gallery');
      return;
    }
    loadReflectionQuestions();
  }, [galleryItem, navigate, loadReflectionQuestions]);

  const handleResponseChange = (index, value) => {
    setResponses(prev => ({
      ...prev,
      [index]: value
    }));
    setIsSaved(false);
  };

  const handleSaveJournal = async () => {
    setIsSaving(true);
    try {
      await painPlusAPI.journal.create({
        gallery_item_id: galleryItem.id,
        reflection_questions: JSON.stringify(questions),
        responses: JSON.stringify(Object.values(responses)),
        notes: notes
      });
      setIsSaved(true);
    } catch (err) {
      console.error('Failed to save journal entry:', err);
      setError('Failed to save your reflections. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!galleryItem) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing reflection questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="card-clean mb-8 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Reflect on Your Art</h1>
              <p className="text-gray-600">Take time to explore the meaning behind your creation</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/gallery')}>
              Back to Gallery
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Artwork Display */}
          <div className="lg:col-span-1">
            <div className="card-clean sticky top-8">
              <img
                src={galleryItem.imageUrl}
                alt="Your artwork"
                className="w-full rounded-lg mb-4"
              />
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Your Description:</h3>
                <p className="text-gray-600 text-sm">{galleryItem.description}</p>
              </div>
            </div>
          </div>

          {/* Reflection Questions */}
          <div className="lg:col-span-2 space-y-6">
            {questions.map((question, index) => (
              <div
                key={index}
                className="card-clean animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-gray-800 font-medium leading-relaxed pt-1">
                    {question}
                  </p>
                </div>
                <textarea
                  value={responses[index] || ''}
                  onChange={(e) => handleResponseChange(index, e.target.value)}
                  placeholder="Write your thoughts here..."
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  rows={4}
                />
              </div>
            ))}

            {/* Additional Notes */}
            <div className="card-clean animate-fadeIn">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Additional Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setIsSaved(false);
                }}
                placeholder="Any other thoughts, feelings, or insights you'd like to record..."
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                rows={4}
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between">
              <div>
                {isSaved && (
                  <span className="text-green-600 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Saved!
                  </span>
                )}
              </div>
              <Button
                variant="primary"
                size="large"
                onClick={handleSaveJournal}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Reflections'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reflect;
