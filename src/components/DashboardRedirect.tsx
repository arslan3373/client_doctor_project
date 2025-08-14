import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'doctor') {
      navigate('/doctor/dashboard', { replace: true });
    } else {
      navigate('/patient/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return null; // This component doesn't render anything
};

export default DashboardRedirect;
