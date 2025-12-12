// TechnologiesFromApi.tsx
import { useState } from 'react'; // Используем useState вместо useEffect
import useTechnologiesApi from './TechnologiesApi';
import './TechnologiesFromApi.css';

function TechnologiesFromApi() {
  const {
    technologies,
    loading,
    error,
    fetchTechnologies,
    deleteTechnology,
    updateTechnology
  } = useTechnologiesApi();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Получаем уникальные категории
  const categories = ['all', ...new Set(technologies.map(t => t.category).filter(Boolean) as string[])];

  // Фильтрация технологий
  const filteredTechnologies = technologies.filter(tech => {
    // Поиск по названию и описанию
    if (searchTerm && !tech.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !tech.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Фильтр по категории
    if (categoryFilter !== 'all' && tech.category !== categoryFilter) {
      return false;
    }

    // Фильтр по статусу
    if (statusFilter !== 'all' && tech.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const handleStatusChange = async (id: number, currentStatus: string) => {
    const statusOrder = ['not-started', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex] as 'not-started' | 'in-progress' | 'completed';

    try {
      await updateTechnology(id, { status: newStatus });
    } catch (err) {
      alert(`Ошибка при обновлении статуса: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (confirm(`Удалить технологию "${title}"?`)) {
      try {
        await deleteTechnology(id);
      } catch (err) {
        alert(`Ошибка при удалении: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#ff9800';
      case 'not-started': return '#f44336';
      default: return '#757575';
    }
  };

  if (loading && technologies.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загрузка технологий из API...</p>
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
    <div className="technologies-api">
      <div className="api-header">
        <h2>Технологии из API ({technologies.length})</h2>
        <button onClick={() => fetchTechnologies()} className="refresh-btn">
          Обновить
        </button>
      </div>

      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Поиск технологий..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Все категории' : cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все статусы</option>
            <option value="not-started">Не начато</option>
            <option value="in-progress">В процессе</option>
            <option value="completed">Завершено</option>
          </select>
        </div>
      </div>

      {filteredTechnologies.length === 0 ? (
        <div className="empty-state">
          <p>Технологии не найдены</p>
          {searchTerm && <p>Попробуйте другой поисковый запрос</p>}
        </div>
      ) : (
        <div className="technologies-grid">
          {filteredTechnologies.map(tech => (
            <div
              key={tech.id}
              className="tech-card"
              style={{ borderLeft: `4px solid ${getStatusColor(tech.status)}` }}
            >
              <div className="tech-header">
                <h3 className="tech-title">{tech.title}</h3>
                <button
                  onClick={() => handleDelete(tech.id, tech.title)}
                  className="delete-btn"
                  title="Удалить"
                >
                  ×
                </button>
              </div>

              <p className="tech-description">{tech.description}</p>

              <div className="tech-meta">
                {tech.category && (
                  <span className="tech-category">{tech.category}</span>
                )}
                {tech.difficulty && (
                  <span className={`tech-difficulty ${tech.difficulty}`}>
                    {tech.difficulty}
                  </span>
                )}
              </div>

              <div className="tech-footer">
                <button
                  onClick={() => handleStatusChange(tech.id, tech.status)}
                  className="status-btn"
                  style={{ backgroundColor: getStatusColor(tech.status) }}
                >
                  {tech.status === 'completed' ? 'Завершено' :
                   tech.status === 'in-progress' ? 'В процессе' : 'Не начато'}
                </button>

                {tech.resources && tech.resources.length > 0 && (
                  <div className="tech-resources">
                    <span>Ресурсы: {tech.resources.length}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TechnologiesFromApi;