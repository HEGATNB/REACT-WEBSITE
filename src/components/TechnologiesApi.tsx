
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
}

interface ApiResponse {
  success: boolean;
  data?: Technology[];
  message?: string;
}

function useTechnologiesApi() {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState<string>('');


  useEffect(() => {
    const savedEndpoint = localStorage.getItem('apiEndpoint');
    if (savedEndpoint) {
      setApiEndpoint(savedEndpoint);
    }
  }, []);


  const saveApiEndpoint = (endpoint: string) => {
    setApiEndpoint(endpoint);
    localStorage.setItem('apiEndpoint', endpoint);
  };

  const fetchTechnologies = useCallback(async () => {
    if (!apiEndpoint) {
      const saved = localStorage.getItem('techTrackerData');
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          setTechnologies(parsedData);
        } catch (error) {
          console.error('Ошибка при загрузке данных:', error);
        }
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiEndpoint, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setTechnologies(data.data);
        localStorage.setItem('techTrackerData', JSON.stringify(data.data));
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

  const addTechnology = async (techData: Omit<Technology, 'id'>) => {
    try {
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

      const response = await fetch(apiEndpoint, {
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

      if (data.success && data.data && data.data[0]) {
        const newTech = data.data[0];
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

  const updateTechnology = async (id: number, updates: Partial<Technology>) => {
    try {
      if (!apiEndpoint) {
        const updatedTechnologies = technologies.map(tech =>
          tech.id === id ? { ...tech, ...updates } : tech
        );
        setTechnologies(updatedTechnologies);
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));
        return updatedTechnologies.find(tech => tech.id === id);
      }

      const response = await fetch(`${apiEndpoint}/${id}`, {
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

      if (data.success && data.data && data.data[0]) {
        const updatedTech = data.data[0];
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

  const deleteTechnology = async (id: number) => {
    try {
      if (!apiEndpoint) {
        const updatedTechnologies = technologies.filter(tech => tech.id !== id);
        setTechnologies(updatedTechnologies);
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));
        return true;
      }

      const response = await fetch(`${apiEndpoint}/${id}`, {
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

  const importRoadmap = async (roadmapUrl: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(roadmapUrl);
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const roadmapData = await response.json();

      if (roadmapData.technologies && Array.isArray(roadmapData.technologies)) {
        const addedTechs: Technology[] = [];
        for (const tech of roadmapData.technologies) {
          try {
            const newTech = await addTechnology({
              ...tech,
              status: 'not-started',
              notes: ''
            });
            addedTechs.push(newTech);
          } catch (error) {
            console.error('Ошибка при добавлении технологии:', error);
          }
        }

        return {
          success: true,
          importedCount: addedTechs.length,
          totalCount: roadmapData.technologies.length
        };
      } else {
        throw new Error('Неверный формат данных дорожной карты');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const syncWithApi = async () => {
    if (!apiEndpoint) {
      throw new Error('API эндпоинт не настроен');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiEndpoint + '/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ technologies })
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setTechnologies(data.data);
        localStorage.setItem('techTrackerData', JSON.stringify(data.data));
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