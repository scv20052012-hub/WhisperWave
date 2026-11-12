import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { INITIAL_USERS } from '../services/mockData';
import { safeStorage } from '../services/storage';
import { signaling } from '../services/signaling';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  loginWithGoogle: (email?: string, name?: string) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateProfile: (updates: Partial<User>) => void;
  findUserByHandleOrEmail: (query: string) => User | undefined;
  isSwitchingUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'whisperwave_current_user_v1';
const STORAGE_KEY_ALL_USERS = 'whisperwave_users_directory_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEY_ALL_USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
      // Default to initial user (e.g. scv20052012@gmail.com)
      return INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [isSwitchingUser, setIsSwitchingUser] = useState(false);

  // Sync profile changes from signaling and storage across browser tabs / users
  useEffect(() => {
    const unsubscribe = signaling.subscribe((msg) => {
      if (msg.type === 'profile-updated' && msg.updatedUser) {
        const remoteUser = msg.updatedUser;
        setUsers((prev) =>
          prev.map((u) => (u.id === remoteUser.id ? { ...u, ...remoteUser } : u))
        );
        setCurrentUser((current) =>
          current && current.id === remoteUser.id ? { ...current, ...remoteUser } : current
        );
      }
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_ALL_USERS && e.newValue) {
        try {
          const freshUsers = JSON.parse(e.newValue);
          setUsers(freshUsers);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      safeStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    } else {
      safeStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(users));
  }, [users]);

  const loginWithGoogle = async (customEmail?: string, customName?: string) => {
    const email = customEmail || 'scv20052012@gmail.com';
    const name = customName || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1));
    const handle = `@${email.split('@')[0]}`;

    // Check if user already exists in directory
    let existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!existing) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        handle,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        statusText: '🔒 Usando WhisperWave con Cifrado de Extremo a Extremo',
        isOnline: true,
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
    } else {
      const updated = { ...existing, isOnline: true };
      setCurrentUser(updated);
    }
  };

  const logout = () => {
    if (currentUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, isOnline: false } : u))
      );
    }
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    setIsSwitchingUser(true);
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
    setTimeout(() => setIsSwitchingUser(false), 300);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);

    const updatedUsers = users.map((u) => (u.id === updated.id ? updated : u));
    setUsers(updatedUsers);

    try {
      safeStorage.setItem(STORAGE_KEY_ALL_USERS, JSON.stringify(updatedUsers));
      safeStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save updated users directory:', e);
    }

    // Broadcast profile change to other users/tabs in real-time
    try {
      signaling.send({
        type: 'profile-updated',
        updatedUser: updated,
        senderId: updated.id,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to broadcast profile update:', e);
    }
  };

  const findUserByHandleOrEmail = (query: string): User | undefined => {
    const clean = query.trim().toLowerCase().replace(/^@/, '');
    return users.find((u) => {
      const uHandle = u.handle.toLowerCase().replace(/^@/, '');
      const uEmail = u.email.toLowerCase();
      const uName = u.name.toLowerCase();
      return uHandle === clean || uEmail === clean || uName.includes(clean);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        loginWithGoogle,
        logout,
        switchUser,
        updateProfile,
        findUserByHandleOrEmail,
        isSwitchingUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
