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
    }
  }, []);

  const saveApiEndpoint = (endpoint: string) => {
    const normalizedEndpoint = endpoint.trim();
    setApiEndpoint(normalizedEndpoint);
    localStorage.setItem('apiEndpoint', normalizedEndpoint);
  };

  // Получение текущего origin для относительных путей
  const getApiUrl = (endpoint: string): string => {
    // Если endpoint пустой, используем относительный путь по умолчанию
    if (!endpoint) {
      return '/api/technologies';
    }
    
    // Если endpoint начинается с http, используем как есть
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    
    // Если endpoint начинается с /, используем относительный путь
    if (endpoint.startsWith('/')) {
      return endpoint;
    }
    
    // По умолчанию добавляем /api/technologies
    return '/api/technologies';
  };

  const fetchTechnologies = useCallback(async () => {
    // Если endpoint не настроен, используем данные из localStorage
    if (!apiEndpoint) {
      const saved = localStorage.getItem('techTrackerData');
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          setTechnologies(parsedData);
        } catch (error) {
          console.error('Ошибка при загрузке локальных данных:', error);
        }
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = getApiUrl(apiEndpoint);
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        }
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
      // Если API не настроено, работаем локально
      if (!apiEndpoint) {
        const newTech: Technology = {
          ...techData,
          id: Date.now(),
          createdAt: new Date().toISOString()
        };

        const updatedTechnologies = [...technologies, newTech];
        setTechnologies(updatedTechnologies);
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));
        return newTech;
      }

      const url = getApiUrl(apiEndpoint);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      // Если API не настроено, работаем локально
      if (!apiEndpoint) {
        const updatedTechnologies = technologies.map(tech =>
          tech.id === id ? { ...tech, ...updates, updatedAt: new Date().toISOString() } : tech
        );
        setTechnologies(updatedTechnologies);
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));
        const updatedTech = updatedTechnologies.find(tech => tech.id === id);
        if (!updatedTech) throw new Error('Технология не найдена');
        return updatedTech;
      }

      const url = `${getApiUrl(apiEndpoint)}/${id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
      // Если API не настроено, работаем локально
      if (!apiEndpoint) {
        const updatedTechnologies = technologies.filter(tech => tech.id !== id);
        setTechnologies(updatedTechnologies);
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));
        return true;
      }

      const url = `${getApiUrl(apiEndpoint)}/${id}`;
      const response = await fetch(url, {
        method: 'DELETE'
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

  const importRoadmap = async (roadmapUrl: string): Promise<ImportResult> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(roadmapUrl);
      if (!response.ok) {
        throw new Error(`Ошибка HTTP при загрузке roadmap: ${response.status}`);
      }

      const roadmapData = await response.json();
      let technologiesToImport: any[] = [];

      // Разные форматы roadmaps
      if (Array.isArray(roadmapData)) {
        technologiesToImport = roadmapData;
      } else if (roadmapData.technologies && Array.isArray(roadmapData.technologies)) {
        technologiesToImport = roadmapData.technologies;
      } else {
        throw new Error('Неверный формат данных дорожной карты. Ожидается массив или объект с полем "technologies"');
      }

      const addedTechs: Technology[] = [];
      for (const tech of technologiesToImport) {
        try {
          const newTech = await addTechnology({
            title: tech.title || tech.name || 'Без названия',
            description: tech.description || tech.desc || '',
            status: 'not-started',
            notes: '',
            category: tech.category || 'uncategorized',
            difficulty: tech.difficulty || 'beginner',
            resources: tech.resources || tech.links || []
          });
          addedTechs.push(newTech);
        } catch (error) {
          console.error('Ошибка при добавлении технологии:', error);
        }
      }

      return {
        success: true,
        importedCount: addedTechs.length,
        totalCount: technologiesToImport.length
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const syncWithApi = async (): Promise<boolean> => {
    if (!apiEndpoint) {
      throw new Error('API эндпоинт не настроен');
    }

    try {
      setLoading(true);
      setError(null);

      const url = `${getApiUrl(apiEndpoint)}/sync`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ technologies })
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP при синхронизации: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        if (Array.isArray(data.data)) {
          setTechnologies(data.data);
          localStorage.setItem('techTrackerData', JSON.stringify(data.data));
        }
        return true;
      } else {
        throw new Error(data.message || 'Ошибка синхронизации');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
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
    importRoadmap,
    syncWithApi,
    saveApiEndpoint,
    setTechnologies
  };
}

export default useTechnologiesApi;