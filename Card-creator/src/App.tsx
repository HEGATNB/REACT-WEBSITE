import './App.css';
import Card, { RoadMap } from './components/TechnologyCard';

interface Technology {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
}

const technologies: Technology[] = [
  { id: 1, title: 'React Components', description: 'Изучение базовых компонентов', status: 'completed' },
  { id: 2, title: 'JSX Syntax', description: 'Освоение синтаксиса JSX', status: 'in-progress' },
  { id: 3, title: 'State Management', description: 'Работа с состоянием компонентов', status: 'not-started' }
];

function App() {
  const total = technologies.length;
  const learned = technologies.filter(tech => tech.status === "completed").length;

  return (
    <div className="App">
      {/* Один RoadMap вверху */}
      <div className="progress-header">
        <RoadMap total={total} learned={learned} />
      </div>

      {/* Контейнер с тремя карточками */}
      <div className="card-container">
        {technologies.map(tech => (
          <Card
            key={tech.id}
            title={tech.title}
            description={tech.description}
            status={tech.status}
          />
        ))}
      </div>
    </div>
  );
}

export default App;