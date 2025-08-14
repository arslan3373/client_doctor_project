import { createContext } from 'react';
import { AuthContextType } from './AuthContext.types';

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
