import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState } from '../../redux/store';
import { logout } from '../../redux/slices/authSlice';
import { LogOut, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto w-full px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">EA</span>
            </div>
            <span className="text-title text-foreground font-semibold text-lg">EngageAI</span>
          </Link>

          {/* Right: User Info, Bell, Avatar */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">{user?.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
              <Link to="/profile" className="text-xs text-primary underline mt-1">Profile</Link>
            </div>
            {/* Bell icon placeholder (add notification bell here if needed) */}
            {/* <Bell className="w-5 h-5 text-muted-foreground" /> */}
            {/* Avatar */}
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link to="/dashboard" className="btn-ghost px-3 py-2 text-sm">Dashboard</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="btn-ghost px-3 py-2 text-sm">Admin</Link>
              )}
            </nav>
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="btn-ghost p-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};