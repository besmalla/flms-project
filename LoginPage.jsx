import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ProtectedRoute({ children, requiredRole }) {
  const token = authService.getToken();
  const user  = authService.getUser();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/profile" replace />;

  return children;
}
