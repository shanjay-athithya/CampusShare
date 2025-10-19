import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { user } = useAuth();
  const [userResources, setUserResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalDownloads: 0,
    totalUpvotes: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserResources();
    }
  }, [user]);

  const fetchUserResources = async () => {
    try {
      setLoading(true);
      // This would need a backend endpoint to get user's resources
      // For now, we'll simulate with the general resources endpoint
      const response = await api.get('/resources');
      const allResources = response.data.resources || [];
      
      // Filter resources by current user (this is a client-side filter)
      // In a real app, you'd have a backend endpoint like /api/users/me/resources
      const userResources = allResources.filter(
        resource => resource.uploadedBy.id === user.id
      );
      
      setUserResources(userResources);
      
      // Calculate stats
      const totalDownloads = userResources.reduce((sum, resource) => sum + resource.downloads, 0);
      const totalUpvotes = userResources.reduce((sum, resource) => sum + resource.upvotes, 0);
      
      setStats({
        totalUploads: userResources.length,
        totalDownloads,
        totalUpvotes
      });
    } catch (error) {
      console.error('Error fetching user resources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Please log in</h3>
          <p className="text-gray-600 mb-4">You need to be logged in to view your profile.</p>
          <Link
            to="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">{user.department}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📤</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Uploads</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalUploads}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <span className="text-green-600 text-lg">📥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Downloads</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalDownloads}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">👍</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Upvotes</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalUpvotes}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Resources */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Your Resources</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your resources...</p>
              </div>
            ) : userResources.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                <p className="text-gray-600 mb-4">Upload your first resource to get started!</p>
                <Link
                  to="/upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Upload Resource
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userResources.map((resource) => (
                  <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          <Link 
                            to={`/resources/${resource.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {resource.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 mb-3">{resource.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {resource.department}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {resource.subject}
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                            Semester {resource.semester}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>👍 {resource.upvotes}</span>
                          <span>👎 {resource.downvotes}</span>
                          <span>📥 {resource.downloads} downloads</span>
                          <span>📅 {new Date(resource.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
