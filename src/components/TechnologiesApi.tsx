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

interface RoadmapImportResponse {
  success: boolean;
  data: Technology[];
  roadmapTitle: string;
  totalCount: number;
  message?: string;
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
    if (!endpoint) {
      return 'https://react-website-igpb.onrender.com/api-technologies';
    }

    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    if (endpoint.startsWith('/api-technologies')) {
      return `https://react-website-igpb.onrender.com${endpoint}`;
    }

    if (endpoint.startsWith('/')) {
      return `https://react-website-igpb.onrender.com${endpoint}`;
    }

    return 'https://react-website-igpb.onrender.com/api-technologies';
  };

  // Функция для получения базового URL API (без конкретного endpoint)
  const getBaseApiUrl = (): string => {
    if (apiEndpoint) {
      const url = new URL(getApiUrl(apiEndpoint));
      return `${url.protocol}//${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '80')}`;
    }
    return 'https://react-website-igpb.onrender.com';
  };

  const fetchTechnologies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = getApiUrl(apiEndpoint);
      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
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

  const importRoadmap = async (roadmapUrl: string): Promise<ImportResult> => {
    try {
      setLoading(true);
      setError(null);

      // Используем proxy через наш бэкенд для обхода CORS
      const baseUrl = getBaseApiUrl();
      const importUrl = `${baseUrl}/api/import-roadmap`;

      console.log('Importing roadmap via proxy:', importUrl);
      console.log('Source URL:', roadmapUrl);

      const response = await fetch(importUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ url: roadmapUrl })
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP при импорте: ${response.status} ${response.statusText}`);
      }

      const data: RoadmapImportResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Не удалось импортировать дорожную карту');
      }

      // Обработка импортированных технологий
      if (data.data && Array.isArray(data.data)) {
        const importedTechs = data.data.map((tech, index) => ({
          ...tech,
          id: Date.now() + index // Уникальные ID
        }));

        const updatedTechnologies = [...technologies, ...importedTechs];
        setTechnologies(updatedTechnologies);
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

        console.log(`Successfully imported ${importedTechs.length} technologies from roadmap: ${data.roadmapTitle}`);

        return {
          success: true,
          importedCount: importedTechs.length,
          totalCount: importedTechs.length
        };
      }

      return {
        success: true,
        importedCount: 0,
        totalCount: 0
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      console.error('Ошибка при импорте дорожной карты:', err);
      throw new Error(`Ошибка при импорте дорожной карты: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

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

  // Функция синхронизации с API
  const syncWithApi = async () => {
    try {
      const url = getApiUrl(apiEndpoint);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setTechnologies(data.data);
        localStorage.setItem('techTrackerData', JSON.stringify(data.data));
        console.log('Data synced with API:', data.data.length, 'technologies');
      } else {
        throw new Error(data.message || 'Не удалось синхронизировать данные');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка синхронизации: ${errorMessage}`);
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
    setTechnologies,
    importRoadmap,
    syncWithApi
  };
}

export default useTechnologiesApi;