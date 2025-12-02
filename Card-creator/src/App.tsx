
import './App.css';
import Card, { RoadMap, QuickActions } from './components/TechnologyCard';
import { useState, useMemo } from 'react';
import { useSaveData, TechnologyNotes } from './components/SaveData'; // Fixed import

interface Technology {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  notes: string; // Added notes property
}

const initialTechnologies: Technology[] = [
  { id: 1, title: 'React Components', description: 'Изучение базовых компонентов', status: 'completed', notes: '' },
  { id: 2, title: 'JSX Syntax', description: 'Освоение синтаксиса JSX', status: 'in-progress', notes: '' },
  { id: 3, title: 'State Management', description: 'Работа с состоянием компонентов', status: 'not-started', notes: '' }
];

function App() {
  const [technologies, setTechnologies] = useState<Technology[]>(initialTechnologies);
  const [currentFilter, setCurrentFilter] = useState<string>('all');

  // Use the save data hook
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

  // Fixed: Added this function
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

  const filteredTechnologies = useMemo(() => {
    return technologies.filter(tech => {
      switch (currentFilter) {
        case 'not-started':
          return tech.status === 'not-started';
        case 'in-progress':
          return tech.status === 'in-progress';
        case 'completed':
          return tech.status === 'completed';
        default:
          return true; // 'all'
      }
    });
  }, [technologies, currentFilter]);

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
          onFilterChange={setCurrentFilter}
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
            {filteredTechnologies.map(tech => (
              <div key={tech.id} className="technology-card-wrapper">
                <Card
                title={tech.title}
                description={tech.description}
                status={tech.status}
                notes={tech.notes} // вместо note={tech.notes}
                techId={tech.id}
                onStatusChange={() => changeStatus(tech.id)}
                onNotesChange={updateTechnologyNotes}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;