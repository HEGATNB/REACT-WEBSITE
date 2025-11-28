import './App.css';
import Card, { RoadMap } from './components/TechnologyCard';
import { useState } from 'react';

interface Technology {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
}

const initialTechnologies: Technology[] = [
  { id: 1, title: 'React Components', description: 'Изучение базовых компонентов', status: 'completed' },
  { id: 2, title: 'JSX Syntax', description: 'Освоение синтаксиса JSX', status: 'in-progress' },
  { id: 3, title: 'State Management', description: 'Работа с состоянием компонентов', status: 'not-started' }
];

function App() {
  const [technologies, setTechnologies] = useState<Technology[]>(initialTechnologies);

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

  const total = technologies.length;
  const learned = technologies.filter(tech => tech.status === "completed").length;

  return (
    <div className="App">
      <div className="progress-header">
        <RoadMap total={total} learned={learned} />
      </div>
      <div className="card-container">
        {technologies.map(tech => (
          <Card
            key={tech.id}
            title={tech.title}
            description={tech.description}
            status={tech.status}
            onStatusChange={() => changeStatus(tech.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default App;