import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Card, { RoadMap, QuickActions } from './components/TechnologyCard';
import { useState, useEffect } from 'react';
import useTechnologiesApi from './components/TechnologiesApi';
import Navigation from './components/navigation';
import TechnologyDetail from './pages/technologyDetail';
import TechnologyList from './pages/technologyList';
import AddTechnology from './pages/AddTechnology';
import Stats from './pages/stats';
import SettingsPage from './pages/settings';
import ApiSettings from './components/ApiSettings';
import TechnologiesFromApi from './components/TechnologiesFromApi';

function App() {
  const {
    technologies,
    loading,
    initialLoading,
    error,
    fetchTechnologies,
    updateTechnology,
    markAllDone,
    resetAllStatuses,
    exportData,
    savePendingUpdates
  } = useTechnologiesApi();

  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();

  // Загружаем данные при первом рендере
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchTechnologies();
        setIsInitialized(true);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setIsInitialized(true); // Все равно помечаем как инициализированное
      }
    };

    if (!isInitialized) {
      loadData();
    }
  }, [fetchTechnologies, isInitialized]);

  // Сохраняем изменения при уходе со страницы
  useEffect(() => {
    return () => {
      savePendingUpdates();
    };
  }, [savePendingUpdates, location.pathname]);

  const changeStatus = async (id: number) => {
    const statusOrder: Array<'not-started' | 'in-progress' | 'completed'> = ['not-started', 'in-progress', 'completed'];

    const tech = technologies.find(t => t.id === id);
    if (tech) {
      const currentIndex = statusOrder.indexOf(tech.status);
      const nextIndex = (currentIndex + 1) % statusOrder.length;

      try {
        await updateTechnology(id, { status: statusOrder[nextIndex] });
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    }
  };

  const updateTechnologyNotes = async (techId: number, newNotes: string) => {
    try {
      await updateTechnology(techId, { notes: newNotes });
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  const handleMarkAllDone = () => {
    markAllDone();
  };

  const handleResetAllStatuses = () => {
    resetAllStatuses();
  };

  const randomNextTechnology = async () => {
    const notStartedTech = technologies.filter(tech => tech.status === 'not-started');

    if (notStartedTech.length === 0) {
      alert('Все технологии уже начаты или завершены!');
      return;
    }

    const randomTech = notStartedTech[Math.floor(Math.random() * notStartedTech.length)];

    try {
      await updateTechnology(randomTech.id, { status: 'in-progress' });
      alert(`Выбранная технология "${randomTech.title}" теперь в процессе изучения!`);
    } catch (err) {
      console.error('Failed to update random tech:', err);
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    setSearchQuery('');
  };

  const handleExportData = (): string => {
    const dataStr = exportData();
    return dataStr;
  };

  const filteredTechnologies = technologies.filter(tech => {
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return tech.title.toLowerCase().includes(query) ||
        tech.description.toLowerCase().includes(query) ||
        tech.notes.toLowerCase().includes(query);
    }

    switch (currentFilter) {
      case 'not-started':
        return tech.status === 'not-started';
      case 'in-progress':
        return tech.status === 'in-progress';
      case 'completed':
        return tech.status === 'completed';
      default:
        return true;
    }
  });

  const total = technologies.length;
  const learned = technologies.filter(tech => tech.status === "completed").length;
  const notStarted = technologies.filter(tech => tech.status === "not-started").length;
  const inProgress = technologies.filter(tech => tech.status === "in-progress").length;

  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка данных из API...</p>
      </div>
    );
  }

  if (error && technologies.length === 0) {
    return (
      <div className="error-container">
        <h3>Ошибка загрузки данных</h3>
        <p>{error}</p>
        <button onClick={() => fetchTechnologies()} className="retry-btn">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="App">
      <Navigation />
      <Routes>
        <Route path="/" element={
          <>
            <div className="page-content">
              <div className="progress-header">
                <RoadMap
                  total={total}
                  learned={learned}
                  inProgress={inProgress}
                  notStarted={notStarted}
                  currentFilter={currentFilter}
                  onFilterChange={handleFilterChange}
                  onSearch={handleSearch}
                  searchResultsCount={filteredTechnologies.length}
                  searchQuery={searchQuery}
                />
              </div>
              <div className="main-content-wrapper">
                <div className="main-content-container">
                  <div className="quick-actions-section">
                    <QuickActions
                      onMarkAllDone={handleMarkAllDone}
                      onResetAll={handleResetAllStatuses}
                      onRandomNext={randomNextTechnology}
                      onExportData={handleExportData}
                    />
                  </div>
                  <div className="cards-section">
                    <div className="cards-container">
                      {filteredTechnologies.length > 0 ? (
                        filteredTechnologies.map(tech => (
                          <div key={tech.id} className="technology-card-wrapper">
                            <Card
                              title={tech.title}
                              description={tech.description}
                              status={tech.status}
                              notes={tech.notes}
                              techId={tech.id}
                              onStatusChange={() => changeStatus(tech.id)}
                              onNotesChange={updateTechnologyNotes}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="no-results">
                          <p>Ничего не найдено. Попробуйте другой запрос или измените фильтр.</p>
                          {technologies.length === 0 && (
                            <button
                              onClick={() => fetchTechnologies()}
                              className="refresh-btn"
                              style={{ marginTop: '10px' }}
                            >
                              Загрузить данные
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        } />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/technologies" element={<TechnologyList />} />
        <Route path="/api-settings" element={<ApiSettings />} />
        <Route path="/api-technologies" element={<TechnologiesFromApi />} />
        <Route path="/technology/:techId" element={<TechnologyDetail />} />
        <Route path="/add-technology" element={<AddTechnology />} />
      </Routes>
    </div>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWrapper;