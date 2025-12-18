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

function useTechnologiesApi() {
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
  const [shouldFetchFromApi, setShouldFetchFromApi] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const pendingUpdates = useRef<Map<number, Partial<Technology>>>(new Map());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Инициализация - загрузка данных из localStorage
  useEffect(() => {
    const initData = async () => {
      try {
        setInitialLoading(true);

        // Загружаем endpoint
        const savedEndpoint = localStorage.getItem('apiEndpoint');
        if (savedEndpoint) {
          setApiEndpoint(savedEndpoint);
        }

        // Загружаем локальные данные
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

        // Не загружаем автоматически из API при старте
        console.log('🚫 Автоматическая синхронизация с API отключена');

      } catch (error) {
        console.error('Ошибка инициализации:', error);
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

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Функция сохранения накопившихся изменений в API
  const savePendingUpdates = async () => {
    if (pendingUpdates.current.size === 0) return;

    try {
      console.log('💾 Сохранение накопившихся изменений в API:', pendingUpdates.current.size);

      const updatesArray = Array.from(pendingUpdates.current.entries());
      const updatePromises = updatesArray.map(([id, updates]) =>
        updateTechnologyToApi(id, updates)
      );

      await Promise.all(updatePromises);
      pendingUpdates.current.clear();
      setHasPendingChanges(false);
      console.log('✅ Все изменения сохранены в API');

    } catch (error) {
      console.error('❌ Ошибка при сохранении изменений в API:', error);
      setHasPendingChanges(true);
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

  const fetchTechnologies = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      // Проверяем, нужно ли делать запрос
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;

      if (!force && timeSinceLastFetch < 60000 && technologies.length > 0) { // 60 секунд кеш
        console.log('📦 Используем кешированные данные, последний запрос был', timeSinceLastFetch / 1000, 'сек назад');
        setLoading(false);
        return technologies;
      }

      console.log('🌐 Загрузка технологий из API:', apiEndpoint);

      const response = await fetch(apiEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        signal: AbortSignal.timeout(10000) // Таймаут 10 секунд
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && Array.isArray(data.data)) {
        console.log('✅ Получено от API:', data.data.length, 'технологий');

        // Проверяем, изменились ли данные
        const newData = data.data;
        const currentData = technologies;

        // Простая проверка на изменения
        const hasChanges = JSON.stringify(newData) !== JSON.stringify(currentData);

        if (hasChanges) {
          console.log('🔄 Данные изменились, обновляем локальное состояние');
          setTechnologies(newData);
          localStorage.setItem('techTrackerData', JSON.stringify(newData));
        } else {
          console.log('✅ Данные не изменились, пропускаем обновление');
        }

        setLastFetchTime(Date.now());
        return newData;
      } else {
        throw new Error(data.message || 'Не удалось загрузить данные');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('❌ Ошибка при загрузке технологий из API:', err);

      // Если API недоступен, не перезаписываем локальные данные
      console.log('📦 Оставляем локальные данные без изменений');

      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, technologies, lastFetchTime]);

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

        // Ищем локально
        const localResults = technologies.filter(tech =>
          tech.title.toLowerCase().includes(query.toLowerCase()) ||
          tech.description.toLowerCase().includes(query.toLowerCase()) ||
          tech.category?.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults(localResults);

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

      // Исправление: правильно получаем base URL
      let importUrl;
      if (apiEndpoint.startsWith('http')) {
        // Если полный URL (http/https), заменяем путь
        importUrl = apiEndpoint.replace('/api/technologies', '/api/import-roadmap');
      } else {
        // Если относительный путь, строим правильный URL
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
          category: tech.category || 'imported'
        }));

        console.log('🆕 Создано импортированных технологий:', importedTechs.length);

        // Добавляем импортированные технологии
        const updatedTechnologies = [...technologies, ...importedTechs];
        setTechnologies(updatedTechnologies);
        localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

        // Отмечаем, что есть изменения для синхронизации
        setHasPendingChanges(true);

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

      // Отмечаем, что есть изменения для синхронизации
      setHasPendingChanges(true);

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

      // Отмечаем, что есть изменения для синхронизации
      setHasPendingChanges(true);

      // Добавляем в очередь для сохранения в API (отложенное)
      pendingUpdates.current.set(id, updates);

      // Сбрасываем предыдущий таймер
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Устанавливаем новый таймер для сохранения в API через 30 секунд
      saveTimeoutRef.current = setTimeout(async () => {
        await savePendingUpdates();
      }, 30000);

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

      // Отмечаем, что есть изменения для синхронизации
      setHasPendingChanges(true);

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      throw new Error(`Ошибка при удалении технологии: ${errorMessage}`);
    }
  };

  const syncWithApi = async (force = false): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Ручная синхронизация с API');

      // 1. Сначала сохраняем все локальные изменения в API
      if (pendingUpdates.current.size > 0) {
        console.log('💾 Сохраняем локальные изменения в API...');
        await savePendingUpdates();
      }

      // 2. Затем загружаем обновленные данные из API
      console.log('🌐 Загружаем данные из API...');
      await fetchTechnologies(force);

      // 3. Сбрасываем флаг изменений
      setHasPendingChanges(false);

      console.log('✅ Синхронизация завершена');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(`Ошибка синхронизации: ${errorMessage}`);
      console.error('❌ Ошибка синхронизации:', err);
      throw err;
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

    // Отмечаем, что есть изменения для синхронизации
    setHasPendingChanges(true);
  };

  const resetAllStatuses = async () => {
    const updatedTechnologies = technologies.map(tech => ({
      ...tech,
      status: 'not-started' as const,
      updatedAt: new Date().toISOString()
    }));

    setTechnologies(updatedTechnologies);
    localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

    // Отмечаем, что есть изменения для синхронизации
    setHasPendingChanges(true);
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

  // Функция для синхронизации только локальных данных с API
  const syncLocalToApi = async (): Promise<boolean> => {
    try {
      console.log('🔄 Синхронизация локальных данных с API...');
      setLoading(true);

      // Загружаем текущие данные из API
      const apiData = await fetchTechnologies(true);

      // Создаем карту данных из API для быстрого поиска
      const apiDataMap = new Map(apiData.map(tech => [tech.id, tech]));

      // Получаем локальные данные
      const localData = technologies;

      // Определяем, какие данные нужно обновить/добавить
      const updates: Array<{id: number, data: Partial<Technology>}> = [];
      const newTechs: Technology[] = [];

      localData.forEach(localTech => {
        const apiTech = apiDataMap.get(localTech.id);
        if (apiTech) {
          // Проверяем, есть ли изменения
          const hasChanges = JSON.stringify(localTech) !== JSON.stringify(apiTech);
          if (hasChanges) {
            updates.push({ id: localTech.id, data: localTech });
          }
        } else {
          // Новая технология, которой нет в API
          newTechs.push(localTech);
        }
      });

      console.log(`📊 Найдено ${updates.length} обновлений и ${newTechs.length} новых технологий`);

      // Выполняем обновления
      if (updates.length > 0) {
        console.log('📤 Отправляем обновления в API...');
        const updatePromises = updates.map(({ id, data }) =>
          updateTechnologyToApi(id, data)
        );
        await Promise.all(updatePromises);
      }

      // Добавляем новые технологии
      if (newTechs.length > 0) {
        console.log('📤 Добавляем новые технологии в API...');
        const addPromises = newTechs.map(tech =>
          addTechnologyToApi(tech)
        );
        await Promise.all(addPromises);
      }

      // После синхронизации обновляем данные из API
      await fetchTechnologies(true);
      setHasPendingChanges(false);

      console.log('✅ Синхронизация завершена успешно');
      return true;

    } catch (error) {
      console.error('❌ Ошибка синхронизации:', error);
      throw error;
    } finally {
      setLoading(false);
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
    hasPendingChanges,

    // Действия
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

    // Поиск
    handleSearchChange,
    clearSearch,

    // Утилиты
    savePendingUpdates
  };
}

export default useTechnologiesApi;