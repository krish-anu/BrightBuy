import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock users for demonstration
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'John Admin',
    email: 'admin@brightbuy.com'
  },
  {
    id: 2,
    username: 'warehouse',
    password: 'warehouse123',
    role: 'warehouse',
    name: 'Sarah Warehouse',
    email: 'warehouse@brightbuy.com'
  },
  {
    id: 3,
    username: 'delivery',
    password: 'delivery123',
    role: 'delivery',
    name: 'Mike Delivery',
    email: 'delivery@brightbuy.com'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing user session on app load
  useEffect(() => {
    const savedUser = Cookies.get('brightbuy_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        Cookies.remove('brightbuy_user');
      }
    }
  }, []);

  // Login function
  const login = async (username, password) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Save user to state
      setUser(userWithoutPassword);
      
      // Save user to cookie (expires in 7 days)
      Cookies.set('brightbuy_user', JSON.stringify(userWithoutPassword), { expires: 7 });
      
      setIsLoading(false);
      return { success: true, user: userWithoutPassword };
    } else {
      setIsLoading(false);
      return { success: false, error: 'Invalid username or password' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    Cookies.remove('brightbuy_user');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return user !== null;
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
    mockUsers: mockUsers.map(({ password, ...user }) => user) // Return users without passwords for demo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
