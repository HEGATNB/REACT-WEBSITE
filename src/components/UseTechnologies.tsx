import { useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash/debounce';
import { useNotification } from './NotificationContext';

export interface Technology {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  notes: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  resources?: string[];
  studyStartDate: string;
  studyEndDate: string;
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

const TECHNOLOGY_UPDATED_EVENT = 'technologyUpdated';

function useTechnologiesApi() {
  const { showSuccess, showError, showInfo } = useNotification();

  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState<string>(() => {
    const savedEndpoint = localStorage.getItem('apiEndpoint');
    if (savedEndpoint && savedEndpoint.trim() &&
        (savedEndpoint.startsWith('http://') || savedEndpoint.startsWith('https://'))) {
      return savedEndpoint.trim();
    }
    if (process.env.NODE_ENV === 'production') {
      return '/api/technologies';
    }
    return 'http://localhost:5000/api/technologies';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Technology[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const pendingUpdates = useRef<Map<number, Partial<Technology>>>(new Map());
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);
  const isSavingToApi = useRef(false);
  const lastSyncTimeRef = useRef<number>(Date.now());

  const notifyTechnologyUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent(TECHNOLOGY_UPDATED_EVENT));
  }, []);

  const updateTechnologyToApi = async (id: number, updates: Partial<Technology>) => {
    try {
      console.log(`📤 Отправка обновления в API для id ${id}:`, updates);
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

      console.log(`✅ Обновление id ${id} сохранено в API`);
      return data.data;
    } catch (error) {
      console.error('Ошибка при обновлении технологии в API:', error);
      throw error;
    }
  };

  const fetchTechnologies = useCallback(async (force = false) => {
    if (!force && technologies.length > 0) {
      const timeSinceLastFetch = Date.now() - lastFetchTime;
      if (timeSinceLastFetch < 5 * 60 * 1000) { // 5 минут
        console.log('📦 Используем локальные данные');
        return technologies;
      }
    }

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
        credentials: 'omit',
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && Array.isArray(data.data)) {
        console.log('✅ Получено от API:', data.data.length, 'технологий');

        const newData = data.data.map(tech => ({
          ...tech,
          studyStartDate: tech.studyStartDate || new Date().toISOString().split('T')[0],
          studyEndDate: tech.studyEndDate || '',
          notes: tech.notes || '',
          category: tech.category || ''
        }));

        setTechnologies(newData);
        localStorage.setItem('techTrackerData', JSON.stringify(newData));
        setLastFetchTime(Date.now());
        setHasPendingChanges(false);

        if (force) {
          showSuccess(`Загружено ${data.data.length} технологий из API`);
        }

        return newData;
      } else {
        throw new Error(data.message || 'Не удалось загрузить данные');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('❌ Ошибка при загрузке технологий из API:', err);

      const saved = localStorage.getItem('techTrackerData');
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          console.log('📦 Возвращаем локальные данные из кэша');
          setTechnologies(parsedData);
          return parsedData;
        } catch (e) {
          console.error('Ошибка при загрузке локальных данных:', e);
        }
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, technologies, lastFetchTime, showSuccess]);

  useEffect(() => {
    if (isInitialized.current) return;

    const initData = async () => {
      try {
        setInitialLoading(true);
        isInitialized.current = true;

        const savedEndpoint = localStorage.getItem('apiEndpoint');
        if (savedEndpoint) {
          setApiEndpoint(savedEndpoint);
        }

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

        // Загружаем данные из API сразу при инициализации
        try {
          await fetchTechnologies();
        } catch (error) {
          console.error('Ошибка при загрузке из API:', error);
        }

        console.log('💾 Режим локального хранения: изменения сохраняются только локально');

      } catch (error) {
        console.error('Ошибка инициализации:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    initData();
  }, []);

  useEffect(() => {
    const handleTechnologyUpdate = () => {
      const saved = localStorage.getItem('techTrackerData');
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          setTechnologies(parsedData);
        } catch (e) {
          console.error('Ошибка при обновлении локальных данных:', e);
        }
      }
    };

    window.addEventListener(TECHNOLOGY_UPDATED_EVENT, handleTechnologyUpdate);

    return () => {
      window.removeEventListener(TECHNOLOGY_UPDATED_EVENT, handleTechnologyUpdate);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (pendingUpdates.current.size > 0 && !isSavingToApi.current) {
        console.log('🚪 Сохраняем изменения в API перед закрытием страницы');
        e.preventDefault();
        e.returnValue = 'Изменения сохраняются...';

        await savePendingUpdates();
        return 'Изменения сохраняются...';
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' &&
          pendingUpdates.current.size > 0 &&
          !isSavingToApi.current) {
        console.log('🔄 Сохраняем изменения в API при переходе на другую вкладку');
        await savePendingUpdates();
        lastSyncTimeRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const shouldRefresh = Date.now() - lastSyncTimeRef.current > 5 * 60 * 1000;
        if (shouldRefresh) {
          console.log('🔄 Возвращение на вкладку, обновляем данные');
          fetchTechnologies(true).catch(console.error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (pendingUpdates.current.size > 0 && !isSavingToApi.current) {
        console.log('📤 Сохраняем изменения в API при размонтировании');
        savePendingUpdates().catch(console.error);
      }
    };
  }, []);

  const savePendingUpdates = async () => {
    if (pendingUpdates.current.size === 0 || isSavingToApi.current) return;

    try {
      isSavingToApi.current = true;
      const updatesCount = pendingUpdates.current.size;
      console.log('💾 Сохранение изменений в API:', updatesCount);

      const updatesToProcess = new Map(pendingUpdates.current);

      const updatesArray = Array.from(updatesToProcess.entries());
      const updatePromises = updatesArray.map(([id, updates]) => {
        console.log(`📤 Отправка обновления для id ${id}:`, updates);
        return updateTechnologyToApi(id, updates);
      });

      await Promise.all(updatePromises);

      updatesArray.forEach(([id]) => {
        pendingUpdates.current.delete(id);
      });

      setHasPendingChanges(pendingUpdates.current.size > 0);
      console.log('✅ Изменения сохранены в API');
      lastSyncTimeRef.current = Date.now();

    } catch (error) {
      console.error('❌ Ошибка при сохранении изменений в API:', error);
      setHasPendingChanges(true);
    } finally {
      isSavingToApi.current = false;
    }
  };

  const saveApiEndpoint = (endpoint: string) => {
    const normalizedEndpoint = endpoint.trim();
    setApiEndpoint(normalizedEndpoint);
    localStorage.setItem('apiEndpoint', normalizedEndpoint);
    showSuccess('API endpoint сохранен');
  };

  const searchTechnologies = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);

        const localResults = technologies.filter(tech =>
          tech.title.toLowerCase().includes(query.toLowerCase()) ||
          tech.description.toLowerCase().includes(query.toLowerCase()) ||
          tech.category?.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults(localResults);
        if (localResults.length === 0) {
          showInfo('По вашему запросу ничего не найдено');
        }

      } catch (err) {
        console.error('Ошибка при поиске:', err);
        showError('Ошибка при поиске технологий');
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [technologies, showError, showInfo]
  );

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
      showInfo('Импорт roadmap...');

      let importUrl;
      if (apiEndpoint.startsWith('http')) {
        importUrl = apiEndpoint.replace('/api/technologies', '/api/import-roadmap');
      } else {
        const basePath = apiEndpoint.replace('/api/technologies', '');
        importUrl = `${basePath}/api/import-roadmap`;
      }

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
          category: tech.category || 'imported',
          studyStartDate: tech.studyStartDate || new Date().toISOString().split('T')[0],
          studyEndDate: tech.studyEndDate || ''
        }));

        console.log('🆕 Создано импортированных технологий:', importedTechs.length);

        const updatedTechnologies = [...technologies, ...importedTechs];
        setTechnologies(updatedTechnologies);
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

        setHasPendingChanges(true);
        importedTechs.forEach(tech => {
          pendingUpdates.current.set(tech.id, tech);
        });
        notifyTechnologyUpdate();

        showSuccess(`Импортировано ${importedTechs.length} технологий из "${data.roadmapTitle}"`);

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
      showError(`Ошибка импорта: ${errorMessage}`);

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
        ...techData,
        studyStartDate: techData.studyStartDate || new Date().toISOString().split('T')[0],
        studyEndDate: techData.studyEndDate || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedTechnologies = [...technologies, newTech];
      setTechnologies(updatedTechnologies);
      localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

      setHasPendingChanges(true);
      pendingUpdates.current.set(newTech.id, newTech);
      notifyTechnologyUpdate();

      showSuccess(`Технология "${newTech.title}" добавлена`);

      return newTech;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      showError(`Ошибка при добавлении: ${errorMessage}`);
      throw new Error(`Ошибка при добавлении технологии: ${errorMessage}`);
    }
  };

  const updateTechnology = async (id: number, updates: Partial<Technology>): Promise<Technology> => {
    try {
      const tech = technologies.find(t => t.id === id);
      if (!tech) throw new Error('Технология не найдена');

      const updatedTech = {
        ...tech,
        ...updates,
        updatedAt: new Date().toISOString(),
        studyStartDate: updates.studyStartDate || tech.studyStartDate,
        studyEndDate: updates.studyEndDate || tech.studyEndDate
      };

      const updatedTechnologies = technologies.map(t =>
        t.id === id ? updatedTech : t
      );

      setTechnologies(updatedTechnologies);
      localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

      setHasPendingChanges(true);
      pendingUpdates.current.set(id, updates);

      notifyTechnologyUpdate();
      console.log(`📝 Технология "${tech.title}" обновлена локально`);

      return updatedTech;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      showError(`Ошибка при обновлении: ${errorMessage}`);
      throw new Error(`Ошибка при обновлении технологии: ${errorMessage}`);
    }
  };

  const deleteTechnology = async (id: number): Promise<boolean> => {
    try {
      const tech = technologies.find(t => t.id === id);
      if (!tech) throw new Error('Технология не найдена');

      const updatedTechnologies = technologies.filter(tech => tech.id !== id);
      setTechnologies(updatedTechnologies);
      localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

      setHasPendingChanges(true);
      pendingUpdates.current.set(id, { deleted: true });
      notifyTechnologyUpdate();

      showSuccess(`Технология "${tech.title}" удалена`);

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      showError(`Ошибка при удалении: ${errorMessage}`);
      throw new Error(`Ошибка при удалении технологии: ${errorMessage}`);
    }
  };

  const syncWithApi = async (force = false): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      showInfo('Синхронизация с API...');

      console.log('🔄 Ручная синхронизация с API');
      if (pendingUpdates.current.size > 0) {
        console.log('💾 Сохраняем локальные изменения в API...');
        await savePendingUpdates();
      }
      console.log('🌐 Загружаем данные из API...');
      await fetchTechnologies(true);

      setHasPendingChanges(false);
      lastSyncTimeRef.current = Date.now();

      showSuccess('Синхронизация завершена');
      console.log('✅ Синхронизация завершена');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка синхронизации: ${errorMessage}`);
      console.error('❌ Ошибка синхронизации:', err);
      showError(`Ошибка синхронизации: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markAllDone = async () => {
    try {
      const updatedTechnologies = technologies.map(tech => ({
        ...tech,
        status: 'completed' as const,
        updatedAt: new Date().toISOString()
      }));
      setTechnologies(updatedTechnologies);
      localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

      setHasPendingChanges(true);
      technologies.forEach(tech => {
        pendingUpdates.current.set(tech.id, { status: 'completed' });
      });
      notifyTechnologyUpdate();
      showSuccess('Все технологии отмечены как завершенные');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      showError(`Ошибка: ${errorMessage}`);
      throw err;
    }
  };

  const resetAllStatuses = async () => {
    try {
      const updatedTechnologies = technologies.map(tech => ({
        ...tech,
        status: 'not-started' as const,
        updatedAt: new Date().toISOString()
      }));
      setTechnologies(updatedTechnologies);
      localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

      setHasPendingChanges(true);

      technologies.forEach(tech => {
        pendingUpdates.current.set(tech.id, { status: 'not-started' });
      });

      notifyTechnologyUpdate();

      showSuccess('Статусы всех технологий сброшены');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      showError(`Ошибка: ${errorMessage}`);
      throw err;
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

    showSuccess('Данные успешно экспортированы');
    return dataStr;
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const syncLocalToApi = async (): Promise<boolean> => {
    try {
      console.log('🔄 Синхронизация локальных данных с API...');
      showInfo('Синхронизация локальных данных с API...');
      setLoading(true);

      await savePendingUpdates();

      await fetchTechnologies(true);

      setHasPendingChanges(false);
      lastSyncTimeRef.current = Date.now();

      showSuccess('Синхронизация завершена успешно');
      console.log('✅ Синхронизация завершена успешно');
      return true;

    } catch (error) {
      console.error('❌ Ошибка синхронизации:', error);
      showError('Ошибка синхронизации');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    technologies,
    loading: loading || initialLoading,
    initialLoading,
    error,
    apiEndpoint,
    searchQuery,
    searchResults,
    isSearching,
    hasPendingChanges,

    fetchTechnologies,
    addTechnology,
    updateTechnology,
    deleteTechnology,
    saveApiEndpoint,
    importRoadmap,
    syncWithApi,
    syncLocalToApi,
    markAllDone,
    resetAllStatuses,
    exportData,

    handleSearchChange,
    clearSearch,

    savePendingUpdates
  };
}

export default useTechnologiesApi;