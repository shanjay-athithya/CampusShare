import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import ResourceCard from '../components/ResourceCard';

const Home = () => {
  console.log('Home component is rendering');

  // State management
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter and search state
  const [filters, setFilters] = useState({
    department: '',
    subject: '',
    semester: '',
    sort: 'new'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch resources
  const fetchResources = useCallback(async (page = 1, reset = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');

      if (filters.department) params.append('department', filters.department);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.sort) params.append('sort', filters.sort);
      if (debouncedSearch) params.append('search', debouncedSearch);

      try {
        const response = await api.get(`/resources?${params.toString()}`);
        const { resources: newResources, pagination } = response.data;

        if (reset || page === 1) {
          setResources(newResources);
        } else {
          setResources(prev => [...prev, ...newResources]);
        }

        setHasNextPage(pagination.hasNextPage);
        setCurrentPage(pagination.currentPage);
        setTotalItems(pagination.totalItems);
      } catch (error) {
        // Fallback to mock data if database is not available
        console.log('Using mock data for development');
        const mockResponse = await api.get('/mock/resources');
        const mockData = mockResponse.data;

        if (reset || page === 1) {
          setResources(mockData.resources);
        } else {
          setResources(prev => [...prev, ...mockData.resources]);
        }

        setHasNextPage(false);
        setCurrentPage(1);
        setTotalItems(mockData.resources.length);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, debouncedSearch]);

  // Load resources when filters or search change
  useEffect(() => {
    fetchResources(1, true);
  }, [fetchResources]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Load more resources (infinite scroll)
  const loadMore = () => {
    if (!loadingMore && hasNextPage) {
      fetchResources(currentPage + 1, false);
    }
  };

  // Handle vote updates from ResourceCard
  const handleVoteUpdate = (resourceId, voteData) => {
    setResources(prev => prev.map(resource => 
      resource.id === resourceId 
        ? { ...resource, ...voteData }
        : resource
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Campus Resources</h1>
          <p className="text-gray-600">Discover and share academic resources with your campus community.</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                placeholder="e.g., Computer Science"
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                placeholder="e.g., Data Structures"
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select
                value={filters.semester}
                onChange={(e) => handleFilterChange('semester', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">Newest First</option>
                <option value="top">Most Upvoted</option>
                <option value="downloads">Most Downloaded</option>
                <option value="old">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info */}
        {!loading && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {resources.length} of {totalItems} resources
            </p>
          </div>
        )}

        {/* Resources List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading resources...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading resources</h3>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => fetchResources(1, true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">Try adjusting your filters or upload the first resource!</p>
            </div>
          ) : (
            <>
              {resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onVoteUpdate={handleVoteUpdate}
                />
              ))}

              {/* Load More Button */}
              {hasNextPage && (
                <div className="text-center py-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-md font-medium transition-colors"
                  >
                    {loadingMore ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      'Load More Resources'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
