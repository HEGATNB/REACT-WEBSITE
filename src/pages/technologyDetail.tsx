import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './technologyDetail.css';

interface Technology {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  notes: string;
  category?: string;
  studyStartDate: string;
  studyEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

function TechnologyDetail() {
  const { techId } = useParams<{ techId: string }>();
  const [technology, setTechnology] = useState<Technology | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Загружаем данные из localStorage или используем общий стейт
    const loadTechnology = () => {
      const saved = localStorage.getItem('techTrackerData');
      if (saved) {
        try {
          const parsedData = JSON.parse(saved) as Technology[];
          const foundTech = parsedData.find(t => t.id === Number(techId));
          setTechnology(foundTech || null);
        } catch (error) {
          console.error('Ошибка при загрузке данных:', error);
        }
      }
      setIsLoading(false);
    };

    loadTechnology();
  }, [techId]);

  const getColorByStatus = (status: Technology['status']): string => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#ff9800';
      case 'not-started': return '#f44336';
      default: return '#f44336';
    }
  };

  const getStatusText = (status: Technology['status']): string => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'in-progress': return 'В процессе';
      case 'not-started': return 'Не начато';
      default: return 'Не начато';
    }
  };

  if (isLoading) {
    return <div className="technology-detail-loading">Загрузка...</div>;
  }

  if (!technology) {
    return (
      <div className="technology-detail-not-found">
        <h2>Технология не найдена</h2>
        <Link to="/technologies">Вернуться к списку технологий</Link>
      </div>
    );
  }

  return (
    <div className="technology-detail-page">
      <div className="detail-back-button">
        <Link to="/technologies">← Назад к списку</Link>
      </div>

      <div
        className="technology-detail-card"
        style={{ backgroundColor: getColorByStatus(technology.status) }}
      >
        <div className="detail-header">
          <h1 className="detail-title">{technology.title}</h1>
          <div className="detail-status-badge">
            {getStatusText(technology.status)}
          </div>
        </div>
        <div className="detail-study-timeline">
          <h3>Сроки изучения:</h3>
          <div className="timeline-dates">
            <div className="date-item">
              <span className="date-label">Начало изучения:</span>
              <span className="date-value">
                {new Date(technology.studyStartDate).toLocaleDateString('ru-RU')}
              </span>
            </div>
            {technology.studyEndDate && (
              <div className="date-item">
                <span className="date-label">Планируемое окончание:</span>
                <span className="date-value">
                  {new Date(technology.studyEndDate).toLocaleDateString('ru-RU')}
                </span>
              </div>
            )}
          </div>
        </div>
        {technology.category && (
          <div className="detail-category">
            Категория: <span>{technology.category}</span>
          </div>
        )}

        <div className="detail-description">
          <h3>Описание:</h3>
          <p>{technology.description}</p>
        </div>

        <div className="detail-notes">
          <h3>Заметки:</h3>
          <div className="notes-content">
            {technology.notes || <em>Заметок пока нет</em>}
          </div>
        </div>

        <div className="detail-footer">
          <div className="detail-id">
            ID: {technology.id}
          </div>
          <Link to={`/edit-technology/${technology.id}`} className="edit-link">
            Редактировать
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TechnologyDetail;