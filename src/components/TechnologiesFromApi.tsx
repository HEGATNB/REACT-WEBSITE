import { useState, useEffect } from 'react';
import useTechnologiesApi from './TechnologiesApi';
import './TechnologiesFromApi.css';

// Тип для статуса технологии
type TechnologyStatus = 'completed' | 'in-progress' | 'not-started';

// Тип для технологии (на основе структуры из вашего API)
interface Technology {
  id: number;
  title: string;
  description: string;
  status: TechnologyStatus;
  category?: string;  // frontend, backend и т.д.
  tags?: string[];    // Дополнительные теги
  notes?: string;
  resources?: string[];
}

function TechnologiesFromApi() {
  // Хук должен возвращать эти функции и данные
  const {
    technologies,
    loading,
    error,
    fetchTechnologies,
    deleteTechnology
  } = useTechnologiesApi();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<TechnologyStatus | 'all'>('all');
  const [filteredTechnologies, setFilteredTechnologies] = useState<Technology[]>([]);

  // Получаем уникальные категории из данных
  const categories = ['all', ...new Set(technologies
    .map(t => t.category)
    .filter((cat): cat is string => Boolean(cat))
  )];

  // Загружаем технологии при монтировании компонента
  useEffect(() => {
    if (technologies.length === 0) {
      fetchTechnologies();
    }
  }, []);

  // Фильтруем технологии при изменении фильтров или technologies
  useEffect(() => {
    const filtered = technologies.filter(tech => {
      // Фильтр по поиску (ищем в названии, описании и заметках)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          tech.title.toLowerCase().includes(searchLower) ||
          tech.description.toLowerCase().includes(searchLower) ||
          (tech.notes && tech.notes.toLowerCase().includes(searchLower)) ||
          (tech.tags && tech.tags.some(tag => tag.toLowerCase().includes(searchLower)));

        if (!matchesSearch) return false;
      }

      // Фильтр по категории
      if (categoryFilter !== 'all') {
        if (!tech.category || tech.category !== categoryFilter) {
          return false;
        }
      }

      // Фильтр по статусу
      if (statusFilter !== 'all' && tech.status !== statusFilter) {
        return false;
      }

      return true;
    });

    setFilteredTechnologies(filtered);
  }, [technologies, searchTerm, categoryFilter, statusFilter]);

  const handleDelete = async (id: number, title: string) => {
    if (confirm(`Удалить технологию "${title}"?`)) {
      try {
        await deleteTechnology(id);
        // После успешного удаления перезагружаем данные
        await fetchTechnologies();
      } catch (err) {
        alert(`Ошибка при удалении: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
      }
    }
  };

  const getStatusColor = (status: TechnologyStatus): string => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#ff9800';
      case 'not-started': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusText = (status: TechnologyStatus): string => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'in-progress': return 'В процессе';
      case 'not-started': return 'Не начато';
      default: return 'Неизвестно';
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
        <div className="api-actions">
          <button onClick={() => fetchTechnologies()} className="refresh-btn">
            Обновить из API
          </button>
          <span className="filtered-count">
            Отфильтровано: {filteredTechnologies.length}
          </span>
        </div>
      </div>

      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Поиск по названию, описанию, тегам..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Поиск технологий"
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm('')}
              aria-label="Очистить поиск"
            >
              ×
            </button>
          )}
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="category-filter">Категория:</label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Все категории' :
                   cat === 'frontend' ? 'Frontend' :
                   cat === 'backend' ? 'Backend' :
                   cat === 'devops' ? 'DevOps' :
                   cat === 'database' ? 'Базы данных' :
                   cat === 'mobile' ? 'Мобильная разработка' :
                   cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Статус:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TechnologyStatus | 'all')}
              className="filter-select"
            >
              <option value="all">Все статусы</option>
              <option value="not-started">Не начато</option>
              <option value="in-progress">В процессе</option>
              <option value="completed">Завершено</option>
            </select>
          </div>

          <button
            className="clear-filters"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
            disabled={searchTerm === '' && categoryFilter === 'all' && statusFilter === 'all'}
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {filteredTechnologies.length === 0 ? (
        <div className="empty-state">
          <p>Технологии не найдены</p>
          {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all') && (
            <p>Попробуйте изменить параметры фильтрации</p>
          )}
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
            }}
            className="clear-filters-btn"
          >
            Сбросить все фильтры
          </button>
        </div>
      ) : (
        <>
          <div className="technologies-grid">
            {filteredTechnologies.map(tech => (
              <div
                key={tech.id}
                className="tech-card"
                style={{
                  borderLeft: `4px solid ${getStatusColor(tech.status)}`
                }}
              >
                <div className="tech-header">
                  <div className="tech-title-container">
                    <h3 className="tech-title">{tech.title}</h3>
                    {tech.tags && tech.tags.length > 0 && (
                      <div className="tech-tags">
                        {tech.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="tech-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(tech.id, tech.title)}
                    className="delete-btn"
                    title="Удалить"
                    aria-label={`Удалить технологию ${tech.title}`}
                  >
                    ×
                  </button>
                </div>

                <p className="tech-description">{tech.description}</p>

                {tech.notes && (
                  <div className="tech-notes-preview">
                    <strong>Заметки:</strong> {tech.notes.length > 100 ? `${tech.notes.substring(0, 100)}...` : tech.notes}
                  </div>
                )}

                <div className="tech-meta">
                  {tech.category && (
                    <span
                      className="tech-category"
                      aria-label={`Категория: ${tech.category}`}
                    >
                      📁 {tech.category === 'frontend' ? 'Frontend' :
                         tech.category === 'backend' ? 'Backend' :
                         tech.category === 'devops' ? 'DevOps' :
                         tech.category === 'database' ? 'Базы данных' :
                         tech.category === 'mobile' ? 'Мобильная разработка' :
                         tech.category}
                    </span>
                  )}

                  <span
                    className="tech-status-badge"
                    style={{ backgroundColor: getStatusColor(tech.status) }}
                  >
                    {getStatusText(tech.status)}
                  </span>
                </div>

                <div className="tech-footer">
                  <div className="tech-id">
                    ID: {tech.id}
                  </div>

                  {tech.resources && tech.resources.length > 0 && (
                    <div className="tech-resources" aria-label={`Количество ресурсов: ${tech.resources.length}`}>
                      📚 {tech.resources.length}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="filter-info">
            <p>
              Показано {filteredTechnologies.length} из {technologies.length} технологий
              {searchTerm && ` по запросу: "${searchTerm}"`}
              {categoryFilter !== 'all' && `, категория: ${categoryFilter}`}
              {statusFilter !== 'all' && `, статус: ${getStatusText(statusFilter as TechnologyStatus)}`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default TechnologiesFromApi;