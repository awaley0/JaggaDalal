import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import * as chatApi from '../../api/chatApi';

/**
 * BookingRating Component
 * Allows buyers to rate sellers after booking is confirmed
 */
export default function BookingRating({ booking, onRatingSuccess = () => {} }) {
  const [score, setScore] = useState(0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if already rated
  const isAlreadyRated = booking?.rating?.score;

  // Check if booking is confirmed
  const canRate = booking?.status === 'confirmed' || booking?.status === 'completed';

  const handleSubmitRating = async () => {
    if (score === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await chatApi.rateBooking(booking._id, score, comment);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onRatingSuccess(response.data);
        }, 1500);
      }
    } catch (err) {
      setError(err.error || 'Failed to submit rating');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canRate) {
    return null;
  }

  if (isAlreadyRated) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900">Your Rating</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`w-5 h-5 ${
                  i < booking.rating.score ? 'text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold">{booking.rating.score}/5</span>
        </div>
        {booking.rating.comment && (
          <p className="text-sm text-gray-700 mt-3 italic">"{booking.rating.comment}"</p>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-900 font-semibold">✅ Rating submitted successfully!</p>
        <p className="text-sm text-green-700 mt-1">Thank you for your feedback</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-4">⭐ Rate Your Experience</h3>

      {/* Star Rating */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          How was your experience with {booking?.seller?.name || 'the seller'}?
        </label>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => {
                setScore(value);
                setError('');
              }}
              onMouseEnter={() => setHoveredScore(value)}
              onMouseLeave={() => setHoveredScore(0)}
              className="text-3xl transition-transform hover:scale-110"
            >
              {hoveredScore >= value || score >= value ? (
                <StarIcon className="w-8 h-8 text-yellow-400" />
              ) : (
                <StarOutlineIcon className="w-8 h-8 text-gray-400" />
              )}
            </button>
          ))}
        </div>
        {score > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {score === 1 && 'Poor - Very dissatisfied'}
            {score === 2 && 'Fair - Somewhat dissatisfied'}
            {score === 3 && 'Good - Satisfied'}
            {score === 4 && 'Very Good - Very satisfied'}
            {score === 5 && 'Excellent - Highly satisfied'}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
          Add a comment (optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this property/seller..."
          maxLength={500}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{comment.length}/500 characters</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmitRating}
        disabled={isLoading || score === 0}
        className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
          isLoading || score === 0
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-amber-600 hover:bg-amber-700 text-white'
        }`}
      >
        {isLoading ? '⏳ Submitting...' : '✓ Submit Rating'}
      </button>

      <p className="text-xs text-gray-600 text-center mt-3">
        Your rating helps us maintain quality standards and helps other users
      </p>
    </div>
  );
}
