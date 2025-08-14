import { User, RegisterData } from '../../services/api';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isDoctor: boolean;
  isPatient: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: Omit<RegisterData, 'id'>) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<User>;
  checkAuth: () => Promise<boolean>;
}
