import './App.css'
import Card from './components/TechnologyCard'

const technologies = [
  { id: 1, title: 'React Components', description: 'Изучение базовых компонентов', status: 'completed' },
  { id: 2, title: 'JSX Syntax', description: 'Освоение синтаксиса JSX', status: 'in-progress' },
  { id: 3, title: 'State Management', description: 'Работа с состоянием компонентов', status: 'not-started' }
];

// Добавьте этот компонент в ваш App.js
function CardContainer({ children }) {
  return (
    <div className="card-container">
      {children}
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <CardContainer>
        {technologies.map(tech => (
          <Card
            key={tech.id}
            title={tech.title}
            description={tech.description}
            status={tech.status}
          />
        ))}
      </CardContainer>
    </div>
  );
}

export default App;