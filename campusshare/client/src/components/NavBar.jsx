import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold">CampusShare</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Home
            </Link>

            {user ? (
              <>
                <Link
                  to="/upload"
                  className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Upload
                </Link>
                <Link
                  to="/profile"
                  className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-red-600 hover:bg-red-700"
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-3">
                  <span className="text-sm">Welcome, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
