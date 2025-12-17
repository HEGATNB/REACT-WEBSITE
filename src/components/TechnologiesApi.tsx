import { useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash/debounce';

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
  roadmapTitle: string;
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
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState<string>('http://localhost:5000/api/technologies');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Technology[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const pendingUpdates = useRef<Map<number, Partial<Technology>>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Инициализация - загрузка данных из localStorage и API
  useEffect(() => {
    const initData = async () => {
      try {
        setInitialLoading(true);

        // Загружаем endpoint
        const savedEndpoint = localStorage.getItem('apiEndpoint');
        if (savedEndpoint) {
          setApiEndpoint(savedEndpoint);
        }

        // Пробуем загрузить из API
        await fetchTechnologies();

      } catch (error) {
        console.error('Ошибка инициализации:', error);

        // Если API недоступен, пробуем загрузить из localStorage
        const saved = localStorage.getItem('techTrackerData');
        if (saved) {
          try {
            const parsedData = JSON.parse(saved);
            console.log('📦 Загружено из localStorage:', parsedData.length, 'технологий');
            setTechnologies(parsedData);
          } catch (e) {
            console.error('Ошибка при загрузке локальных данных:', e);
          }
        }
      } finally {
        setInitialLoading(false);
      }
    };

    initData();
  }, []);

  // Автосохранение при уходе со страницы
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (pendingUpdates.current.size > 0) {
        await savePendingUpdates();
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && pendingUpdates.current.size > 0) {
        await savePendingUpdates();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Сохраняем при размонтировании компонента
      if (pendingUpdates.current.size > 0) {
        savePendingUpdates();
      }
    };
  }, []);

  // Функция сохранения накопившихся изменений
  const savePendingUpdates = async () => {
    if (pendingUpdates.current.size === 0) return;

    try {
      console.log('💾 Сохранение накопившихся изменений:', pendingUpdates.current.size);

      const updatesArray = Array.from(pendingUpdates.current.entries());
      const updatePromises = updatesArray.map(([id, updates]) =>
        updateTechnologyToApi(id, updates)
      );

      await Promise.all(updatePromises);
      pendingUpdates.current.clear();
      console.log('✅ Все изменения сохранены');

    } catch (error) {
      console.error('❌ Ошибка при сохранении изменений:', error);
      // Можно добавить ретрай логику здесь
    }
  };

  // Функция для обновления в API
  const updateTechnologyToApi = async (id: number, updates: Partial<Technology>) => {
    try {
      const response = await fetch(`${apiEndpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Ошибка обновления');
      }

      return data.data;
    } catch (error) {
      console.error('Ошибка при обновлении технологии в API:', error);
      throw error;
    }
  };

  const saveApiEndpoint = (endpoint: string) => {
    const normalizedEndpoint = endpoint.trim();
    setApiEndpoint(normalizedEndpoint);
    localStorage.setItem('apiEndpoint', normalizedEndpoint);
  };

  const getApiUrl = (): string => {
    return apiEndpoint;
  };

  const fetchTechnologies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🌐 Загрузка технологий из API:', apiEndpoint);

      const response = await fetch(apiEndpoint, {
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
        console.log('✅ Получено от API:', data.data.length, 'технологий');
        setTechnologies(data.data);
        localStorage.setItem('techTrackerData', JSON.stringify(data.data));
        return data.data;
      } else {
        throw new Error(data.message || 'Не удалось загрузить данные');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('❌ Ошибка при загрузке технологий:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  // Поиск технологий с debounce
  const searchTechnologies = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        setError(null);

        // Ищем сначала локально
        const localResults = technologies.filter(tech =>
          tech.title.toLowerCase().includes(query.toLowerCase()) ||
          tech.description.toLowerCase().includes(query.toLowerCase()) ||
          tech.category?.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults(localResults);

        // Если локально не нашли, можно добавить поиск по API
        if (localResults.length === 0) {
          console.log('🔍 Поиск по API не реализован, используем локальный поиск');
        }

      } catch (err) {
        console.error('Ошибка при поиске:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [technologies]
  );

  // Обработчик изменения поискового запроса
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      searchTechnologies(query);
    }, 300);
  }, [searchTechnologies]);

  const importRoadmap = async (roadmapUrl: string): Promise<ImportResult> => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = apiEndpoint.replace('/api/technologies', '');
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

      if (data.success && Array.isArray(data.data)) {
        console.log('📥 Получено от roadmap:', data.data.length, 'технологий');

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

        // Добавляем импортированные технологии
        const updatedTechnologies = [...technologies, ...importedTechs];
        setTechnologies(updatedTechnologies);

        // Сохраняем в localStorage
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

        // Сохраняем в API
        try {
          for (const tech of importedTechs) {
            await addTechnologyToApi(tech);
          }
        } catch (apiError) {
          console.warn('Не удалось сохранить в API, используем локальные данные:', apiError);
        }

        return {
          success: true,
          importedCount: importedTechs.length,
          totalCount: importedTechs.length,
          roadmapTitle: data.roadmapTitle || 'Импортированная дорожная карта'
        };
      }

      throw new Error('Не удалось импортировать данные');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      console.error('❌ Ошибка импорта:', err);
      setError(errorMessage);

      return {
        success: false,
        importedCount: 0,
        totalCount: 0,
        roadmapTitle: ''
      };
    } finally {
      setLoading(false);
    }
  };

  const addTechnologyToApi = async (techData: Technology): Promise<Technology> => {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(techData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        const newTech = Array.isArray(data.data) ? data.data[0] : data.data;
        return newTech;
      } else {
        throw new Error(data.message || 'Не удалось добавить технологию');
      }
    } catch (error) {
      console.error('Ошибка при добавлении в API:', error);
      throw error;
    }
  };

  const addTechnology = async (techData: Omit<Technology, 'id'>): Promise<Technology> => {
    try {
      const maxId = technologies.length > 0
        ? Math.max(...technologies.map(t => t.id))
        : 0;

      const newTech: Technology = {
        id: maxId + 1,
        ...techData
      };

      // Добавляем локально
      const updatedTechnologies = [...technologies, newTech];
      setTechnologies(updatedTechnologies);
      localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

      // Пробуем сохранить в API (но не блокируем пользователя)
      setTimeout(() => {
        addTechnologyToApi(newTech).catch(err =>
          console.warn('Не удалось сохранить в API:', err)
        );
      }, 0);

      return newTech;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка при добавлении технологии: ${errorMessage}`);
    }
  };

  const updateTechnology = async (id: number, updates: Partial<Technology>): Promise<Technology> => {
    try {
      // Обновляем локально сразу
      const updatedTechnologies = technologies.map(tech =>
        tech.id === id ? { ...tech, ...updates, updatedAt: new Date().toISOString() } : tech
      );
      setTechnologies(updatedTechnologies);
      localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

      // Добавляем в очередь для сохранения в API
      pendingUpdates.current.set(id, updates);

      // Сбрасываем предыдущий таймер
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Устанавливаем новый таймер для сохранения в API
      saveTimeoutRef.current = setTimeout(async () => {
        await savePendingUpdates();
      }, 1000); // Сохраняем через 1 секунду после последнего изменения

      const updatedTech = updatedTechnologies.find(tech => tech.id === id);
      if (!updatedTech) throw new Error('Технология не найдена');

      return updatedTech;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка при обновлении технологии: ${errorMessage}`);
    }
  };

  const deleteTechnology = async (id: number): Promise<boolean> => {
    try {
      // Удаляем локально
      const updatedTechnologies = technologies.filter(tech => tech.id !== id);
      setTechnologies(updatedTechnologies);
      localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

      // Удаляем из API
      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
      } catch (apiError) {
        console.warn('Не удалось удалить из API:', apiError);
      }

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка при удалении технологии: ${errorMessage}`);
    }
  };

  const syncWithApi = async () => {
    try {
      setLoading(true);
      await fetchTechnologies();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка синхронизации: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const markAllDone = async () => {
    const updatedTechnologies = technologies.map(tech => ({
      ...tech,
      status: 'completed' as const,
      updatedAt: new Date().toISOString()
    }));

    setTechnologies(updatedTechnologies);
    localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

    // Сохраняем все изменения в API
    const updatePromises = updatedTechnologies.map(tech =>
      updateTechnologyToApi(tech.id, { status: 'completed' })
    );

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.warn('Не удалось синхронизировать с API:', error);
    }
  };

  const resetAllStatuses = async () => {
    const updatedTechnologies = technologies.map(tech => ({
      ...tech,
      status: 'not-started' as const,
      updatedAt: new Date().toISOString()
    }));

    setTechnologies(updatedTechnologies);
    localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

    const updatePromises = updatedTechnologies.map(tech =>
      updateTechnologyToApi(tech.id, { status: 'not-started' })
    );

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.warn('Не удалось синхронизировать с API:', error);
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

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  return {
    // Состояние
    technologies,
    loading: loading || initialLoading,
    initialLoading,
    error,
    apiEndpoint,
    searchQuery,
    searchResults,
    isSearching,

    // Действия
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

    // Поиск
    handleSearchChange,
    clearSearch,

    // Утилиты
    savePendingUpdates
  };
}

export default useTechnologiesApi;