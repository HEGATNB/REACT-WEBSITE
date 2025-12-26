import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  logout: () => void;
  register: (username: string, email?: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // При загрузке проверяем сохраненного пользователя
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);

        // Также устанавливаем пользователя для API данных
        localStorage.setItem('apiUser', parsedUser.username);

        console.log('Loaded user from localStorage:', parsedUser.username);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('apiUser');
      }
    } else {
      console.log('No user found in localStorage');
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password?: string) => {
    setIsLoading(true);
    try {
      // В реальном приложении здесь был бы запрос к API
      // Пока используем локальную аутентификацию

      // Проверяем, есть ли пользователь в localStorage
      const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      let userData: User;

      if (savedUsers.length > 0) {
        // Ищем существующего пользователя
        const existingUser = savedUsers.find((u: any) => u.username === username);
        if (existingUser) {
          userData = existingUser;
          console.log('Found existing user:', username);
        } else {
          // Создаем нового пользователя
          userData = {
            id: Date.now().toString(),
            username,
            createdAt: new Date().toISOString()
          };
          savedUsers.push(userData);
          localStorage.setItem('users', JSON.stringify(savedUsers));
          console.log('Created new user:', username);
        }
      } else {
        // Первый вход - создаем пользователя и мигрируем старые данные
        userData = {
          id: '1',
          username,
          createdAt: new Date().toISOString()
        };

        console.log('First login, creating user:', username);

        // Мигрируем существующие данные к пользователю
        await migrateDataToUser(username);

        localStorage.setItem('users', JSON.stringify([userData]));
      }

      // Сохраняем текущего пользователя
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('apiUser', username);

      // Отправляем событие о смене пользователя
      window.dispatchEvent(new CustomEvent('userChanged', { detail: username }));

      console.log('User logged in successfully:', username);

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email?: string) => {
    // Для простоты используем ту же логику, что и login
    return login(username);
  };

  const logout = () => {
    console.log('Logging out user:', user?.username);
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('apiUser');

    // Отправляем событие о выходе
    window.dispatchEvent(new CustomEvent('userChanged', { detail: null }));

    console.log('User logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      // Обновляем в списке пользователей
      const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = savedUsers.map((u: User) =>
        u.id === user.id ? updatedUser : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
  };

  // Функция миграции старых данных к пользователю
  const migrateDataToUser = async (username: string) => {
    try {
      const oldData = localStorage.getItem('techTrackerData');
      if (oldData) {
        const parsedData = JSON.parse(oldData);

        console.log(`Migrating ${parsedData.length} items to user ${username}`);

        // Добавляем поле пользователя к каждой технологии
        const migratedData = parsedData.map((tech: any) => ({
          ...tech,
          userId: username,
          migratedAt: new Date().toISOString()
        }));

        // Сохраняем под ключом пользователя
        localStorage.setItem(`techTrackerData_${username}`, JSON.stringify(migratedData));

        console.log(`Successfully migrated data to user ${username}`);

        // Старые данные можно сохранить как резервную копию
        localStorage.setItem('techTrackerData_backup', oldData);

        // Удаляем старые данные только после успешной миграции
        localStorage.removeItem('techTrackerData');

        // Также очищаем обычный techTrackerData для будущих операций
        localStorage.removeItem('techTrackerData');
      } else {
        console.log('No existing data to migrate');
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};