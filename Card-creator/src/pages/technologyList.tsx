import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './TechnologyList.css';

interface Technology {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  notes: string;
  category?: string;
}

function TechnologyList() {
  const [technologies, setTechnologies] = useState<Technology[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('techTrackerData');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setTechnologies(parsedData);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    }
  }, []);

  // Получаем цвет по статусу (такой же как в карточках)
  const getColorByStatus = (status: Technology['status']): string => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in-progress':
        return '#ff9800';
      case 'not-started':
        return '#f44336';
      default:
        return '#f44336';
    }
  };

  // Получаем текст статуса на русском
  const getStatusText = (status: Technology['status']): string => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'in-progress': return 'В процессе';
      case 'not-started': return 'Не начато';
      default: return 'Не начато';
    }
  };

  return (
    <div className="technology-list-page">
      <div className="technologies-container">
        <div className="technologies-grid">
          {technologies.map(tech => (
            <div
              key={tech.id}
              className="technology-item"
              style={{ backgroundColor: getColorByStatus(tech.status) }}
            >
              <h3 className="tech-title">{tech.title}</h3>
              <p className="tech-description">{tech.description}</p>

              <div className="tech-meta">
                <div className="tech-status">
                  {getStatusText(tech.status)}
                </div>
                {tech.category && (
                  <div className="tech-category">
                    {tech.category}
                  </div>
                )}
              </div>

              {tech.notes && (
                <div className="tech-notes">
                  <div className="notes-label">Заметки:</div>
                  <p className="notes-content">{tech.notes}</p>
                </div>
              )}

              <div className="tech-footer">
                <Link to={`/technology/${tech.id}`} className="tech-detail-link">
                  Подробнее →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {technologies.length === 0 && (
          <div className="empty-state">
            <p className="empty-text">Технологий пока нет</p>
            <p className="empty-subtext">Начните добавлять технологии, чтобы отслеживать свой прогресс</p>
            <Link to="/add-technology" className="add-first-tech-btn">
              Добавить первую технологию
            </Link>
          </div>
        )}
      </div>

      <div className="add-tech-bottom">
        <Link to="/add-technology" className="add-tech-link">
          + Добавить технологию
        </Link>
      </div>
    </div>
  );
}

export default TechnologyList;