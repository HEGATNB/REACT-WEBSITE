
import './stats.css';

interface Technology {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  notes: string;
  category?: string;
}

interface StatsProps {
  technologies?: Technology[];
}

function Stats({ technologies = [] }: StatsProps) {
  let techData = technologies;

  if (techData.length === 0) {
    try {
      const saved = localStorage.getItem('techTrackerData');
      if (saved) {
        techData = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    }
  }

  const total = techData.length;
  const completed = techData.filter(tech => tech.status === "completed").length;
  const inProgress = techData.filter(tech => tech.status === "in-progress").length;
  const notStarted = techData.filter(tech => tech.status === "not-started").length;
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>Статистика прогресса</h1>
        <p>Визуализация вашего прогресса в изучении технологий.</p>
      </div>

      <div className="stats-summary">
        <div className="stat-item completed">
          <h4>Завершено</h4>
          <p className="stat-number">{completed}</p>
          <p className="stat-percent">
            {total > 0 ? `${((completed / total) * 100).toFixed(1)}%` : '0%'}
          </p>
        </div>
        <div className="stat-item in-progress">
          <h4>В процессе</h4>
          <p className="stat-number">{inProgress}</p>
          <p className="stat-percent">
            {total > 0 ? `${((inProgress / total) * 100).toFixed(1)}%` : '0%'}
          </p>
        </div>
        <div className="stat-item not-started">
          <h4>Не начато</h4>
          <p className="stat-number">{notStarted}</p>
          <p className="stat-percent">
            {total > 0 ? `${((notStarted / total) * 100).toFixed(1)}%` : '0%'}
          </p>
        </div>
        <div className="stat-item total">
          <h4>Всего технологий</h4>
          <p className="stat-number">{total}</p>
          <p className="stat-percent">100%</p>
        </div>
      </div>

      <div className="stats-details">
        <div className="stats-card">
          <h3>Общий прогресс</h3>
          <div className="progress-circle">
            <div className="circle-bg"></div>
            <div
              className="circle-progress"
              style={{
                background: `conic-gradient(#4caf50 ${progressPercentage * 3.6}deg,
                           rgba(255, 255, 255, 0.1) 0deg)`
              }}
            ></div>
            <div className="progress-text">
              <span className="progress-percent">{Math.round(progressPercentage)}%</span>
              <span className="progress-label">{completed} из {total}</span>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <h3>Распределение</h3>
          <div className="distribution-bars">
            <div className="bar-item">
              <span className="bar-label">Завершено</span>
              <div className="bar-container">
                <div
                  className="bar-fill completed-bar"
                  style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="bar-value">{completed}</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">В процессе</span>
              <div className="bar-container">
                <div
                  className="bar-fill inprogress-bar"
                  style={{ width: total > 0 ? `${(inProgress / total) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="bar-value">{inProgress}</span>
            </div>
            <div className="bar-item">
              <span className="bar-label">Не начато</span>
              <div className="bar-container">
                <div
                  className="bar-fill notstarted-bar"
                  style={{ width: total > 0 ? `${(notStarted / total) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="bar-value">{notStarted}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;