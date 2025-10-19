import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ResourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVoting, setIsVoting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Local state for optimistic updates
  const [localUpvotes, setLocalUpvotes] = useState(0);
  const [localDownvotes, setLocalDownvotes] = useState(0);
  const [localUserHasUpvoted, setLocalUserHasUpvoted] = useState(false);
  const [localUserHasDownvoted, setLocalUserHasDownvoted] = useState(false);

  useEffect(() => {
    fetchResource();
  }, [id]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      setError('');
      
      try {
        const response = await api.get(`/resources/${id}`);
        const resourceData = response.data;
        setResource(resourceData);
        setLocalUpvotes(resourceData.upvotes || 0);
        setLocalDownvotes(resourceData.downvotes || 0);
        setLocalUserHasUpvoted(resourceData.userHasUpvoted || false);
        setLocalUserHasDownvoted(resourceData.userHasDownvoted || false);
      } catch (error) {
        // Fallback to mock data
        console.log('Using mock data for development');
        const mockResponse = await api.get('/mock/resources');
        const mockResource = mockResponse.data.resources.find(r => r.id === id);
        
        if (mockResource) {
          setResource(mockResource);
          setLocalUpvotes(mockResource.upvotes || 0);
          setLocalDownvotes(mockResource.downvotes || 0);
          setLocalUserHasUpvoted(mockResource.userHasUpvoted || false);
          setLocalUserHasDownvoted(mockResource.userHasDownvoted || false);
        } else {
          setError('Resource not found');
        }
      }
    } catch (error) {
      console.error('Error fetching resource:', error);
      setError('Failed to load resource');
    } finally {
      setLoading(false);
    }
  };

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
        response = await api.post(`/resources/${id}/vote`, { type });
      } catch (error) {
        console.log('Using mock voting for development');
        response = await api.post(`/mock/resources/${id}/vote`, { type });
      }
      
      const { upvotes, downvotes, userHasUpvoted, userHasDownvoted } = response.data;
      
      // Update with server response
      setLocalUpvotes(upvotes);
      setLocalDownvotes(downvotes);
      setLocalUserHasUpvoted(userHasUpvoted);
      setLocalUserHasDownvoted(userHasDownvoted);

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

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      // Try real download endpoint first, fallback to mock
      let response;
      try {
        response = await api.get(`/resources/${id}/download`);
      } catch (error) {
        console.log('Using mock download for development');
        response = await api.get(`/mock/resources/${id}/download`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resource...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Resource not found</h3>
          <p className="text-gray-600 mb-4">The resource you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{resource.title || 'Untitled Resource'}</h1>
              <p className="text-gray-600 text-lg">{resource.description || 'No description available'}</p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 mb-6">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {resource.department || 'Unknown Department'}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {resource.subject || 'Unknown Subject'}
              </span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                Semester {resource.semester || 'Unknown'}
              </span>
            </div>

            {/* Stats and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-6 mb-4 sm:mb-0">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleVote('up')}
                    disabled={isVoting}
                    className={`p-2 rounded-full transition-colors ${
                      localUserHasUpvoted 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
                    } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    👍
                  </button>
                  <span className="text-sm font-medium">{localUpvotes}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleVote('down')}
                    disabled={isVoting}
                    className={`p-2 rounded-full transition-colors ${
                      localUserHasDownvoted 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                    } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    👎
                  </button>
                  <span className="text-sm font-medium">{localDownvotes}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <span>📥</span>
                  <span className="text-sm font-medium">{resource.downloads || 0} downloads</span>
                </div>
              </div>
              
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium ${
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
                  'Download File'
                )}
              </button>
            </div>

            {/* Uploader Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded by</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {resource.uploadedBy?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{resource.uploadedBy?.name || 'Unknown User'}</p>
                  <p className="text-sm text-gray-600">{resource.uploadedBy?.department || 'Unknown Department'}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Uploaded on {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'Unknown date'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetail;
