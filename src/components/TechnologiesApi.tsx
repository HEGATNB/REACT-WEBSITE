import { useState, useEffect, useCallback } from 'react';

export interface Technology {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  notes: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  resources?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse {
  success: boolean;
  data?: Technology[] | Technology;
  message?: string;
}

interface ImportResult {
  success: boolean;
  importedCount: number;
  totalCount: number;
}

function useTechnologiesApi() {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState<string>('');

  // Загрузка сохраненного endpoint из localStorage
  useEffect(() => {
    const savedEndpoint = localStorage.getItem('apiEndpoint');
    if (savedEndpoint) {
      setApiEndpoint(savedEndpoint);
    } else {
      // Устанавливаем правильный endpoint по умолчанию
      setApiEndpoint('https://react-website-igpb.onrender.com/api-technologies');
    }
  }, []);

  const saveApiEndpoint = (endpoint: string) => {
    const normalizedEndpoint = endpoint.trim();
    setApiEndpoint(normalizedEndpoint);
    localStorage.setItem('apiEndpoint', normalizedEndpoint);
  };

  // Получение правильного URL
  const getApiUrl = (endpoint: string): string => {
    // Если endpoint пустой, используем правильный по умолчанию
    if (!endpoint) {
      return 'https://react-website-igpb.onrender.com/api-technologies';
    }

    // Если endpoint начинается с http, используем как есть
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // Если endpoint начинается с /api-technologies, добавляем полный URL
    if (endpoint.startsWith('/api-technologies')) {
      return `https://react-website-igpb.onrender.com${endpoint}`;
    }

    // Если endpoint начинается с /, добавляем базовый URL
    if (endpoint.startsWith('/')) {
      return `https://react-website-igpb.onrender.com${endpoint}`;
    }

    // По умолчанию используем правильный endpoint
    return 'https://react-website-igpb.onrender.com/api-technologies';
  };

  const fetchTechnologies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Всегда используем API, даже если endpoint не настроен
      const url = getApiUrl(apiEndpoint);
      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors', // Явно указываем режим CORS
        credentials: 'omit' // Не отправляем куки, чтобы избежать CORS проблем
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        if (Array.isArray(data.data)) {
          setTechnologies(data.data);
          localStorage.setItem('techTrackerData', JSON.stringify(data.data));
        } else if (data.data) {
          setTechnologies([data.data]);
          localStorage.setItem('techTrackerData', JSON.stringify([data.data]));
        } else {
          setTechnologies([]);
          localStorage.setItem('techTrackerData', JSON.stringify([]));
        }
      } else {
        throw new Error(data.message || 'Не удалось загрузить данные');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('Ошибка при загрузке технологий:', err);

      // Пробуем загрузить из localStorage при ошибке
      const saved = localStorage.getItem('techTrackerData');
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          setTechnologies(parsedData);
        } catch (error) {
          console.error('Ошибка при загрузке локальных данных:', error);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  const addTechnology = async (techData: Omit<Technology, 'id'>): Promise<Technology> => {
    try {
      const url = getApiUrl(apiEndpoint);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(techData)
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        const newTech = Array.isArray(data.data) ? data.data[0] : data.data;
        const updatedTechnologies = [...technologies, newTech];
        setTechnologies(updatedTechnologies);
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));
        return newTech;
      } else {
        throw new Error(data.message || 'Не удалось добавить технологию');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка при добавлении технологии: ${errorMessage}`);
    }
  };

  const updateTechnology = async (id: number, updates: Partial<Technology>): Promise<Technology> => {
    try {
      const url = `${getApiUrl(apiEndpoint)}/${id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        const updatedTech = Array.isArray(data.data) ? data.data[0] : data.data;
        const updatedTechnologies = technologies.map(tech =>
          tech.id === id ? updatedTech : tech
        );
        setTechnologies(updatedTechnologies);
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));
        return updatedTech;
      } else {
        throw new Error(data.message || 'Не удалось обновить технологию');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка при обновлении технологии: ${errorMessage}`);
    }
  };

  const deleteTechnology = async (id: number): Promise<boolean> => {
    try {
      const url = `${getApiUrl(apiEndpoint)}/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        const updatedTechnologies = technologies.filter(tech => tech.id !== id);
        setTechnologies(updatedTechnologies);
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));
        return true;
      } else {
        throw new Error(data.message || 'Не удалось удалить технологию');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка при удалении технологии: ${errorMessage}`);
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchTechnologies();
  }, [fetchTechnologies]);

  return {
    technologies,
    loading,
    error,
    apiEndpoint,
    fetchTechnologies,
    addTechnology,
    updateTechnology,
    deleteTechnology,
    saveApiEndpoint,
    setTechnologies
  };
}

export default useTechnologiesApi;