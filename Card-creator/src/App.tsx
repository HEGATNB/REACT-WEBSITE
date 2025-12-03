import './App.css';
import Card, { RoadMap, QuickActions } from './components/TechnologyCard';
import Modal from './components/Modal';
import { useState } from 'react';
import useTechnologies from './components/useTechnologies';

function App() {
  const {
    technologies,
    updateStatus,
    updateNotes,
    markAllDone,
    resetAllStatuses,
    exportData,
    setTechnologies
  } = useTechnologies();

  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedData, setExportedData] = useState<string>('');

  const changeStatus = (id: number) => {
    const statusOrder: Array<'not-started' | 'in-progress' | 'completed'> = ['not-started', 'in-progress', 'completed'];

    const tech = technologies.find(t => t.id === id);
    if (tech) {
      const currentIndex = statusOrder.indexOf(tech.status);
      const nextIndex = (currentIndex + 1) % statusOrder.length;
      updateStatus(id, statusOrder[nextIndex]);
    }
  };

  const updateTechnologyNotes = (techId: number, newNotes: string) => {
    updateNotes(techId, newNotes);
  };

  const randomNextTechnology = () => {
    const notStartedTech = technologies.filter(tech => tech.status === 'not-started');

    if (notStartedTech.length === 0) {
      alert('Все технологии уже начаты или завершены!');
      return;
    }

    const randomTech = notStartedTech[Math.floor(Math.random() * notStartedTech.length)];
    updateStatus(randomTech.id, 'in-progress');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    setSearchQuery('');
  };

  const handleExportData = () => {
    const data = exportData();
    setExportedData(data);
    setShowExportModal(true);
    return data;
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

  return (
    <div className="App">
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
      <div className="main-content">
        <div className="quick-actions">
          <QuickActions
            onMarkAllDone={markAllDone}
            onResetAll={resetAllStatuses}
            onRandomNext={randomNextTechnology}
            onExportData={handleExportData}
          />
        </div>
        <div className="cards-section">
          <div className="card-container">
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
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Экспорт данных"
      >
        <p>Данные успешно экспортированы!</p>
        <p>Файл был автоматически загружен на ваш компьютер.</p>
        <p>Вы также можете просмотреть данные в консоли разработчика (F12).</p>
        <button onClick={() => setShowExportModal(false)}>
          Закрыть
        </button>
      </Modal>
    </div>
  );
}

export default App;