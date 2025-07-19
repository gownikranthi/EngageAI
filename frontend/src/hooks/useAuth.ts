import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { setUser } from '../redux/slices/authSlice';
import { authService } from '../services/auth';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check for stored auth data on app initialization
    const storedUser = authService.getStoredUser();
    const storedToken = authService.getStoredToken();

    if (storedUser && storedToken && !auth.user) {
      dispatch(setUser(storedUser));
    }
  }, [dispatch, auth.user]);

  return auth;
};