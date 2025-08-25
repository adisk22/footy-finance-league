import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  switchToUser: (userId: string) => Promise<void>;
  getAvailableUsers: () => Promise<User[]>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (currentUser) {
      try {
        console.log('Refreshing user:', currentUser.id);
        const user = await api.getUserById(currentUser.id);
        console.log('Refreshed user data:', user);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  const switchToUser = async (userId: string) => {
    try {
      const user = await api.getUserById(userId);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error switching user:', error);
    }
  };

  const getAvailableUsers = async () => {
    try {
      console.log('Getting available users...');
      const users = await api.getUsers();
      console.log('Available users:', users);
      setAvailableUsers(users);
      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  };

  // Load users and set the first one as default
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        console.log('UserProvider: Loading users...');
        const users = await getAvailableUsers();
        console.log('UserProvider: Got users:', users);
        
        if (users.length > 0) {
          console.log('UserProvider: Setting current user to:', users[0]);
          setCurrentUser(users[0]);
        } else {
          console.log('UserProvider: No users found');
        }
      } catch (error) {
        console.error('UserProvider: Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      refreshUser, 
      switchToUser,
      getAvailableUsers,
      loading
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
