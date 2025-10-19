import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ResourceCard = ({ resource, onVoteUpdate }) => {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Local state for optimistic updates
  const [localUpvotes, setLocalUpvotes] = useState(resource.upvotes || 0);
  const [localDownvotes, setLocalDownvotes] = useState(resource.downvotes || 0);
  const [localUserHasUpvoted, setLocalUserHasUpvoted] = useState(resource.userHasUpvoted || false);
  const [localUserHasDownvoted, setLocalUserHasDownvoted] = useState(resource.userHasDownvoted || false);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle voting
  const handleVote = async (type) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    // Optimistic update
    const previousUpvoted = localUserHasUpvoted;
    const previousDownvoted = localUserHasDownvoted;
    const previousUpvotes = localUpvotes;
    const previousDownvotes = localDownvotes;

    // Calculate optimistic state
    let newUpvoted = false;
    let newDownvoted = false;
    let newUpvotes = localUpvotes;
    let newDownvotes = localDownvotes;

    if (type === 'up') {
      if (localUserHasUpvoted) {
        // Remove upvote
        newUpvotes = localUpvotes - 1;
      } else {
        // Add upvote
        newUpvotes = localUpvotes + 1;
        newUpvoted = true;
        
        // Remove downvote if exists
        if (localUserHasDownvoted) {
          newDownvotes = localDownvotes - 1;
        }
      }
    } else if (type === 'down') {
      if (localUserHasDownvoted) {
        // Remove downvote
        newDownvotes = localDownvotes - 1;
      } else {
        // Add downvote
        newDownvotes = localDownvotes + 1;
        newDownvoted = true;
        
        // Remove upvote if exists
        if (localUserHasUpvoted) {
          newUpvotes = localUpvotes - 1;
        }
      }
    }

    // Apply optimistic updates
    setLocalUserHasUpvoted(newUpvoted);
    setLocalUserHasDownvoted(newDownvoted);
    setLocalUpvotes(newUpvotes);
    setLocalDownvotes(newDownvotes);

    try {
      // Try real voting endpoint first, fallback to mock
      let response;
      try {
        response = await api.post(`/resources/${resource.id}/vote`, { type });
      } catch (error) {
        console.log('Using mock voting for development');
        response = await api.post(`/mock/resources/${resource.id}/vote`, { type });
      }
      
      const { upvotes, downvotes, userHasUpvoted, userHasDownvoted } = response.data;
      
      // Update with server response
      setLocalUpvotes(upvotes);
      setLocalDownvotes(downvotes);
      setLocalUserHasUpvoted(userHasUpvoted);
      setLocalUserHasDownvoted(userHasDownvoted);

      // Notify parent component if callback provided
      if (onVoteUpdate) {
        onVoteUpdate(resource.id, { upvotes, downvotes, userHasUpvoted, userHasDownvoted });
      }

      toast.success(`Vote ${type === 'up' ? 'upvoted' : 'downvoted'} successfully`);
    } catch (error) {
      // Revert optimistic updates on error
      setLocalUserHasUpvoted(previousUpvoted);
      setLocalUserHasDownvoted(previousDownvoted);
      setLocalUpvotes(previousUpvotes);
      setLocalDownvotes(previousDownvotes);

      toast.error(error.response?.data?.error || 'Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      // Try real download endpoint first, fallback to mock
      let response;
      try {
        response = await api.get(`/resources/${resource.id}/download`);
      } catch (error) {
        console.log('Using mock download for development');
        response = await api.get(`/mock/resources/${resource.id}/download`);
      }
      
      if (response.data.fileUrl) {
        // Server returned a file URL, open in new tab
        window.open(response.data.fileUrl, '_blank');
        toast.success('Download started');
      } else {
        // Server is streaming the file
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = resource.title || 'resource';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Download completed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to download');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            <Link
              to={`/resources/${resource.id}`}
              className="hover:text-blue-600 transition-colors"
            >
              {resource.title}
            </Link>
          </h3>
          <p className="text-gray-600 mb-3 line-clamp-2">{resource.description}</p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              {resource.department}
            </span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
              {resource.subject}
            </span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
              Semester {resource.semester}
            </span>
          </div>
          
          {/* Voting Buttons */}
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => handleVote('up')}
              disabled={isVoting}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                localUserHasUpvoted
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
              </svg>
              <span>{localUpvotes}</span>
            </button>
            
            <button
              onClick={() => handleVote('down')}
              disabled={isVoting}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                localUserHasDownvoted
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.333v-5.834a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z"/>
              </svg>
              <span>{localDownvotes}</span>
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {resource.downloads || 0} downloads
            </span>
          </div>
          
          {/* Uploader and Date */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>👤 {resource.uploadedBy?.name || 'Unknown User'}</span>
            <span>📅 {formatDate(resource.createdAt)}</span>
          </div>
        </div>
        
        <div className="ml-4 flex flex-col space-y-2">
          <Link
            to={`/resources/${resource.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            View Details
          </Link>
          
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isDownloading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isDownloading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </span>
            ) : (
              'Download'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
