import './App.css';
import Card, { RoadMap, QuickActions } from './components/TechnologyCard';
import { useState, useMemo } from 'react';
import { useSaveData } from './components/SaveData';

interface Technology {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  notes: string;
}

const initialTechnologies: Technology[] = [
  { id: 1, title: 'React Components', description: 'Изучение базовых компонентов', status: 'completed', notes: '' },
  { id: 2, title: 'JSX Syntax', description: 'Освоение синтаксиса JSX', status: 'in-progress', notes: '' },
  { id: 3, title: 'State Management', description: 'Работа с состоянием компонентов', status: 'not-started', notes: '' }
];

function App() {
  const [technologies, setTechnologies] = useState<Technology[]>(initialTechnologies);
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useSaveData(technologies, setTechnologies);

  const changeStatus = (id: number) => {
    const statusOrder: Technology['status'][] = ['not-started', 'in-progress', 'completed'];

    setTechnologies(prevTech =>
      prevTech.map(tech => {
        if (tech.id === id) {
          const currentIndex = statusOrder.indexOf(tech.status);
          const nextIndex = (currentIndex + 1) % statusOrder.length;
          return {
            ...tech,
            status: statusOrder[nextIndex]
          };
        }
        return tech;
      })
    );
  };

  const updateTechnologyNotes = (techId: number, newNotes: string) => {
    setTechnologies(prevTech =>
      prevTech.map(tech =>
        tech.id === techId ? { ...tech, notes: newNotes } : tech
      )
    );
  };

  const markAllDone = () => {
    setTechnologies(prevTech =>
      prevTech.map(tech => ({
        ...tech,
        status: 'completed' as const
      }))
    );
  };

  const resetAllStatuses = () => {
    setTechnologies(prevTech =>
      prevTech.map(tech => ({
        ...tech,
        status: 'not-started' as const
      }))
    );
  };

  const randomNextTechnology = () => {
    const notStartedTech = technologies.filter(tech => tech.status === 'not-started');

    if (notStartedTech.length === 0) {
      alert('Все технологии уже начаты или завершены!');
      return;
    }

    const randomTech = notStartedTech[Math.floor(Math.random() * notStartedTech.length)];

    setTechnologies(prevTech =>
      prevTech.map(tech =>
        tech.id === randomTech.id
          ? { ...tech, status: 'in-progress' as const }
          : tech
      )
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    setSearchQuery('');
  };

  const filteredTechnologies = useMemo(() => {
    let result = technologies;

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(tech =>
        tech.title.toLowerCase().includes(query) ||
        tech.description.toLowerCase().includes(query) ||
        tech.notes.toLowerCase().includes(query)
      );
    }

    switch (currentFilter) {
      case 'not-started':
        return result.filter(tech => tech.status === 'not-started');
      case 'in-progress':
        return result.filter(tech => tech.status === 'in-progress');
      case 'completed':
        return result.filter(tech => tech.status === 'completed');
      default:
        return result;
    }
  }, [technologies, currentFilter, searchQuery]);

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
    </div>
  );
}

export default App;