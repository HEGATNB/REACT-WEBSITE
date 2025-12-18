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
import MassEditPanel from './components/MassEditPanel';

type Status = 'completed' | 'in-progress' | 'not-started';

interface Technology {
  id: number;
  title: string;
  description: string;
  status: Status;
  notes: string;
  category?: string;
  studyStartDate: string;
  studyEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

function App() {
  const {
    technologies: apiTechnologies,
    loading,
    initialLoading,
    error,
    fetchTechnologies,
    updateTechnology,
    markAllDone,
    resetAllStatuses,
    exportData,
    savePendingUpdates,
    deleteTechnology,
    syncLocalToApi,  // ✅ Теперь это внутри компонента
    hasPendingChanges  // ✅ Теперь это внутри компонента
  } = useTechnologiesApi();  // ✅ Все хуки вызываются внутри компонента

  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMassEditing, setIsMassEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showMassEditPanel, setShowMassEditPanel] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const enhancedTechnologies = apiTechnologies.map(tech => ({
      ...tech,
      studyStartDate: (tech as any).studyStartDate || tech.createdAt || new Date().toISOString(),
      studyEndDate: (tech as any).studyEndDate,
      createdAt: tech.createdAt || new Date().toISOString(),
      updatedAt: tech.updatedAt || new Date().toISOString()
    }));
    setTechnologies(enhancedTechnologies);
  }, [apiTechnologies]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Загрузка технологий из API...');
        await fetchTechnologies();
        setIsInitialized(true);
        console.log(`Загружено ${technologies.length} технологий`);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      loadData();
    }
  }, [fetchTechnologies, isInitialized]);

  useEffect(() => {
    return () => {
      savePendingUpdates();
    };
  }, [savePendingUpdates, location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/') {
      setIsMassEditing(false);
      setSelectedIds([]);
      setShowMassEditPanel(false);
    }
  }, [location.pathname]);

  const changeStatus = async (id: number) => {
    if (isMassEditing) return;

    const statusOrder: Status[] = ['not-started', 'in-progress', 'completed'];
    const tech = technologies.find(t => t.id === id);

    if (tech) {
      const currentIndex = statusOrder.indexOf(tech.status);
      const nextIndex = (currentIndex + 1) % statusOrder.length;

      try {
        await updateTechnology(id, {
          status: statusOrder[nextIndex],
          updatedAt: new Date().toISOString()
        });
        const updatedTechs = technologies.map(t =>
          t.id === id ? { ...t, status: statusOrder[nextIndex], updatedAt: new Date().toISOString() } : t
        );
        setTechnologies(updatedTechs);
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    }
  };

  const updateTechnologyNotes = async (techId: number, newNotes: string) => {
    try {
      await updateTechnology(techId, {
        notes: newNotes,
        updatedAt: new Date().toISOString()
      });
      const updatedTechs = technologies.map(t =>
        t.id === techId ? { ...t, notes: newNotes, updatedAt: new Date().toISOString() } : t
      );
      setTechnologies(updatedTechs);
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  const handleMarkAllDone = async () => {
    try {
      await markAllDone();
      await fetchTechnologies();
    } catch (err) {
      console.error('Failed to mark all as done:', err);
    }
  };

  const handleResetAllStatuses = async () => {
    try {
      await resetAllStatuses();
      await fetchTechnologies();
    } catch (err) {
      console.error('Failed to reset all statuses:', err);
    }
  };

  const randomNextTechnology = async () => {
    const notStartedTech = technologies.filter(tech => tech.status === 'not-started');

    if (notStartedTech.length === 0) {
      alert('Все технологии уже начаты или завершены!');
      return;
    }

    const randomTech = notStartedTech[Math.floor(Math.random() * notStartedTech.length)];

    try {
      await updateTechnology(randomTech.id, {
        status: 'in-progress',
        updatedAt: new Date().toISOString()
      });
      const updatedTechs = technologies.map(t =>
        t.id === randomTech.id ? { ...t, status: 'in-progress', updatedAt: new Date().toISOString() } : t
      );
      setTechnologies(updatedTechs);
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

  const handleSelectCard = (id: number, selected: boolean) => {
    setSelectedIds(prev => {
      if (selected) {
        if (prev.includes(id)) {
          return prev;
        }
        return [...prev, id];
      } else {
        return prev.filter(selectedId => selectedId !== id);
      }
    });
  };

  const handleMassEditClick = () => {
    setIsMassEditing(true);
    setSelectedIds([]);
    setShowMassEditPanel(false);
  };

  const handleCancelMassEdit = () => {
    setIsMassEditing(false);
    setSelectedIds([]);
    setShowMassEditPanel(false);
  };

  const handleDeleteSelected = async (ids: number[]) => {
    try {
      const deletePromises = ids.map(id => deleteTechnology(id));
      await Promise.all(deletePromises);
      const updatedTechs = technologies.filter(tech => !ids.includes(tech.id));
      setTechnologies(updatedTechs);
      setSelectedIds([]);
    } catch (err) {
      console.error('Ошибка при массовом удалении:', err);
      alert('Произошла ошибка при удалении технологий');
    }
  };

  const handleStatusChangeSelected = async (ids: number[], status: Status) => {
    try {
      const updatePromises = ids.map(id =>
        updateTechnology(id, {
          status: status,
          updatedAt: new Date().toISOString()
        })
      );
      await Promise.all(updatePromises);
      const updatedTechs = technologies.map(t =>
        ids.includes(t.id) ? { ...t, status: status, updatedAt: new Date().toISOString() } : t
      );
      setTechnologies(updatedTechs);
      setSelectedIds([]);
    } catch (err) {
      console.error('Ошибка при массовом обновлении статуса:', err);
      alert('Произошла ошибка при обновлении статусов');
    }
  };

  const filteredTechnologies = technologies.filter(tech => {
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return tech.title.toLowerCase().includes(query) ||
        tech.description.toLowerCase().includes(query) ||
        (tech.notes && tech.notes.toLowerCase().includes(query));
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
                  {/* Левая часть: Quick Actions */}
                  <div className="quick-actions-section">
                    <div className="buttons-container">
                      <QuickActions
                        onMarkAllDone={handleMarkAllDone}
                        onResetAll={handleResetAllStatuses}
                        onRandomNext={randomNextTechnology}
                        onExportData={handleExportData}
                      />
                    </div>
                  </div>

                  {/* Центральная часть: Карточки */}
                  <div className="cards-section">
                    <div className="cards-container">
                      {filteredTechnologies.length > 0 ? (
                        filteredTechnologies.map(tech => (
                          <div key={tech.id} className="technology-card-wrapper">
                            <Card
                              title={tech.title}
                              description={tech.description}
                              status={tech.status}
                              notes={tech.notes || ''}
                              techId={tech.id}
                              onStatusChange={() => changeStatus(tech.id)}
                              onNotesChange={updateTechnologyNotes}
                              studyStartDate={tech.studyStartDate}
                              studyEndDate={tech.studyEndDate}
                              isMassEditing={isMassEditing}
                              isSelected={selectedIds.includes(tech.id)}
                              onSelect={handleSelectCard}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="no-results">
                          <p>Ничего не найдено. Попробуйте другой запрос или измените фильтр.</p>
                          {technologies.length === 0 ? (
                            <button
                              onClick={() => fetchTechnologies()}
                              className="refresh-btn"
                              style={{ marginTop: '10px' }}
                            >
                              Загрузить данные из API
                            </button>
                          ) : searchQuery ? (
                            <p>Попробуйте другой поисковый запрос.</p>
                          ) : (
                            <p>Нет технологий, соответствующих текущему фильтру "{currentFilter}".</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mass-edit-section">
                    <div className="mass-edit-panel">
                      {!isMassEditing ? (
                        <button
                          onClick={handleMassEditClick}
                          className="mass-edit-toggle-button"
                          aria-label="Включить режим массового редактирования"
                        >
                          <span className="mass-edit-icon">📋</span>
                          Массовое редактирование
                        </button>
                      ) : (
                        <div className="mass-edit-controls-panel">
                          <div className="mass-edit-info-panel">
                            <div className="selected-info">
                              <span className="selected-count-badge">
                                Выбрано: <strong>{selectedIds.length}</strong>
                              </span>
                              <button
                                onClick={() => setShowMassEditPanel(true)}
                                disabled={selectedIds.length === 0}
                                className="apply-mass-edit-action"
                                aria-label="Применить действие к выбранным карточкам"
                              >
                                Применить действие
                              </button>
                              <button
                                onClick={handleCancelMassEdit}
                                className="cancel-mass-edit-action"
                                aria-label="Отменить режим массового редактирования"
                              >
                                Отмена
                              </button>
                            </div>
                            <p className="mass-edit-instruction">
                              ⓘ Выберите карточки для массового редактирования. Клик по карточке выделяет её.
                              Для выбора с клавиатуры используйте Tab и пробел.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <MassEditPanel
              selectedIds={selectedIds}
              technologies={technologies.map(t => ({ id: t.id, title: t.title, status: t.status }))}
              onDelete={handleDeleteSelected}
              onStatusChange={handleStatusChangeSelected}
              onCancel={handleCancelMassEdit}
              isOpen={showMassEditPanel}
            />
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