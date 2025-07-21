import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../redux/hooks';

const ProfilePage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }
  // Render profile content here
  return (
    <div className="container-xl py-8">
      <h1 className="text-hero text-foreground mb-4">Profile</h1>
      <p className="text-body text-muted-foreground">Welcome, {user.name}!</p>
      {/* Add more profile details here */}
    </div>
  );
};

export default ProfilePage; 