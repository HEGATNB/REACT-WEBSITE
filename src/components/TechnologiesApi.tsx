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
  const [shouldRefresh, setShouldRefresh] = useState(false);

  // Загрузка сохраненного endpoint из localStorage
  useEffect(() => {
    const savedEndpoint = localStorage.getItem('apiEndpoint');
    if (savedEndpoint) {
      setApiEndpoint(savedEndpoint);
    } else {
      setApiEndpoint('https://react-website-igpb.onrender.com/api-technologies');
    }

    // Загружаем данные из localStorage
    const saved = localStorage.getItem('techTrackerData');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        console.log('📦 Загружено из localStorage:', parsedData.length, 'технологий');
        setTechnologies(parsedData);
      } catch (error) {
        console.error('❌ Ошибка при загрузке локальных данных:', error);
      }
    }
    setLoading(false);
  }, []);

  // Обновляем localStorage при изменении technologies
  useEffect(() => {
    if (technologies.length > 0) {
      console.log('💾 Сохранение в localStorage:', technologies.length, 'технологий');
      localStorage.setItem('techTrackerData', JSON.stringify(technologies));
    }
  }, [technologies]);

  const saveApiEndpoint = (endpoint: string) => {
    const normalizedEndpoint = endpoint.trim();
    setApiEndpoint(normalizedEndpoint);
    localStorage.setItem('apiEndpoint', normalizedEndpoint);
  };

  // Получение правильного URL
  const getApiUrl = (endpoint: string): string => {
    if (!endpoint) {
      return 'http://localhost:5000/api/technologies';
    }

    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // Если endpoint начинается с /, добавляем localhost
    if (endpoint.startsWith('/')) {
      return `http://localhost:5000${endpoint}`;
    }

    return 'http://localhost:5000/api/technologies';
  };

  const getBaseApiUrl = (): string => {
    return 'http://localhost:5000';
  };

  const fetchTechnologies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = getApiUrl(apiEndpoint);
      console.log('🌐 Запрос к API:', url);

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
          console.log('✅ Получено от API:', data.data.length, 'технологий');

          // Сохраняем все данные из API
          setTechnologies(data.data);
          localStorage.setItem('techTrackerData', JSON.stringify(data.data));
        }
      } else {
        console.warn('⚠️ Предупреждение от API:', data.message);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('❌ Ошибка при загрузке технологий:', err);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  const importRoadmap = async (roadmapUrl: string): Promise<ImportResult> => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = getBaseApiUrl();
      const importUrl = `${baseUrl}/api/import-roadmap`;

      console.log('🚀 Импорт roadmap из:', roadmapUrl);

      const response = await fetch(importUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ url: roadmapUrl })
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data: RoadmapImportResponse = await response.json();

      // Обработка импортированных технологий
      if (data.data && Array.isArray(data.data)) {
        console.log('📥 Получено от roadmap:', data.data.length, 'технологий');

        // Генерируем уникальные ID
        const maxId = technologies.length > 0
          ? Math.max(...technologies.map(t => t.id))
          : 0;

        const importedTechs = data.data.map((tech, index) => ({
          ...tech,
          id: maxId + index + 1,
          status: 'not-started' as const,
          notes: tech.notes || '',
          category: tech.category || 'imported'
        }));

        console.log('🆕 Создано импортированных технологий:', importedTechs.length);

        // Объединяем с существующими технологиями
        const updatedTechnologies = [...technologies, ...importedTechs];
        console.log('📊 Всего технологий после импорта:', updatedTechnologies.length);

        // Обновляем состояние
        setTechnologies(updatedTechnologies);

        // Сохраняем в localStorage
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

        // Триггерим обновление
        setShouldRefresh(true);

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
      console.error('❌ Ошибка импорта:', err);
      setError(errorMessage);

      return {
        success: false,
        importedCount: 0,
        totalCount: 0
      };
    } finally {
      setLoading(false);
      setShouldRefresh(false);
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

      // Если API не доступен, добавляем локально
      const maxId = technologies.length > 0
        ? Math.max(...technologies.map(t => t.id))
        : 0;

      const newTech: Technology = {
        id: maxId + 1,
        ...techData
      };

      const updatedTechnologies = [...technologies, newTech];
      setTechnologies(updatedTechnologies);
      localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

      return newTech;
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

      // Если API не доступен, обновляем локально
      const updatedTechnologies = technologies.map(tech =>
        tech.id === id ? { ...tech, ...updates } : tech
      );
      setTechnologies(updatedTechnologies);
      localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

      const updatedTech = updatedTechnologies.find(tech => tech.id === id);
      if (!updatedTech) throw new Error('Технология не найдена');

      return updatedTech;
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

      // Если API не доступен, удаляем локально
      const updatedTechnologies = technologies.filter(tech => tech.id !== id);
      setTechnologies(updatedTechnologies);
      localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

      return true;
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
        console.log('🔄 Данные синхронизированы с API:', data.data.length, 'технологий');
        return true;
      } else {
        throw new Error(data.message || 'Не удалось синхронизировать данные');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка синхронизации: ${errorMessage}`);
    }
  };

  // Функции для работы с локальными данными
  const markAllDone = async () => {
    const updatedTechnologies = technologies.map(tech => ({
      ...tech,
      status: 'completed' as const
    }));

    setTechnologies(updatedTechnologies);
    localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

    try {
      await syncWithApi();
    } catch (err) {
      console.log('API sync failed, using local data');
    }
  };

  const resetAllStatuses = async () => {
    const updatedTechnologies = technologies.map(tech => ({
      ...tech,
      status: 'not-started' as const
    }));

    setTechnologies(updatedTechnologies);
    localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

    try {
      await syncWithApi();
    } catch (err) {
      console.log('API sync failed, using local data');
    }
  };

  const exportData = (): string => {
    const data = {
      exportedAt: new Date().toISOString(),
      technologies: technologies
    };
    const dataStr = JSON.stringify(data, null, 2);

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tech-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return dataStr;
  };

  // Функция для принудительного обновления
  const refreshData = () => {
    const saved = localStorage.getItem('techTrackerData');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        console.log('🔄 Принудительное обновление данных:', parsedData.length, 'технологий');
        setTechnologies(parsedData);
      } catch (error) {
        console.error('❌ Ошибка при обновлении данных:', error);
      }
    }
  };

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
    importRoadmap,
    syncWithApi,
    markAllDone,
    resetAllStatuses,
    exportData,
    refreshData, // Добавляем функцию обновления
    shouldRefresh
  };
}

export default useTechnologiesApi;