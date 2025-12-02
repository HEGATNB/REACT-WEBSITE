
import './TechnologyCard.css';
import { useState, useEffect, useRef } from 'react';
import { GiSettingsKnobs } from "react-icons/gi";
import { FaSearch } from "react-icons/fa";
type Status = 'completed' | 'in-progress' | 'not-started';

interface CardProps {
  title: string;
  description: string;
  status: Status;
  notes: string;
  techId: number;
  onStatusChange: (id: number) => void;
  onNotesChange: (techId: number, notes: string) => void;
}

interface RoadMapProps {
  total: number;
  learned: number;
  notStarted: number;
  inProgress: number;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
}

interface QuickActionsProps {
  onMarkAllDone: () => void;
  onResetAll: () => void;
  onRandomNext: () => void;
}

interface FiltersProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const getColorByStatus = (status: Status): string => {
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

function Card({ title, description, status, notes, techId, onStatusChange, onNotesChange }: CardProps) {
  const cardColor = getColorByStatus(status);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.closest('textarea')) {
      return;
    }
    onStatusChange(techId);
  };

  const handleTextareaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNotesChange(techId, e.target.value);
  };

  return (
    <div
      className="Card"
      onClick={handleCardClick}
      style={{ backgroundColor: cardColor }}
    >
      <h2>{title}</h2>
      <p>{description}</p>
      <p>Статус: {status}</p>
      <textarea
        className="note-text-area"
        value={notes}
        onClick={handleTextareaClick}
        onChange={handleTextareaChange}
        placeholder="Впишите сюда свою заметку..."
        rows={3}
      />
      <div className="notes-hint">
        {notes.length > 0 ? `Заметка сохранена (${notes.length} символов)` :
          'Добавьте заметку'}
      </div>
    </div>
  );
}

function QuickActions({ onMarkAllDone, onResetAll, onRandomNext }: QuickActionsProps) {
  return (
    <div className="buttons-container">
      <button className="quick-actions-button" type="button" onClick={onMarkAllDone}>
        Отметить все как выполненные
      </button>
      <button className="quick-actions-button" type="button" onClick={onResetAll}>
        Сбросить все статусы
      </button>
      <button className="quick-actions-button" type="button" onClick={onRandomNext}>
        Случайный выбор следующей технологии
      </button>
    </div>
  );
}

function Filters({ currentFilter, onFilterChange, isVisible, onClose }: FiltersProps) {
  const closeTimerRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleFilterClick = (filter: string) => {
    onFilterChange(filter);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="filters-overlay"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="filters-list">
        <p
          className={`filters-text ${currentFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          Все карточки
        </p>
        <p
          className={`filters-text ${currentFilter === 'not-started' ? 'active' : ''}`}
          onClick={() => handleFilterClick('not-started')}
        >
          Только не начатые
        </p>
        <p
          className={`filters-text ${currentFilter === 'in-progress' ? 'active' : ''}`}
          onClick={() => handleFilterClick('in-progress')}
        >
          Только в процессе
        </p>
        <p
          className={`filters-text ${currentFilter === 'completed' ? 'active' : ''}`}
          onClick={() => handleFilterClick('completed')}
        >
          Только завершенные
        </p>
      </div>
    </div>
  );
}


function RoadMap({ total, learned, notStarted, inProgress, currentFilter, onFilterChange }: RoadMapProps) {
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const progressPercentage = total > 0 ? (learned / total) * 100 : 0;

  useEffect(() => {
    setIsAnimating(true);

    const progressTimer = setTimeout(() => {
      setDisplayedProgress(progressPercentage);
    }, 10);

    const animationTimer = setTimeout(() => {
      setIsAnimating(false);
    }, 800);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(animationTimer);
    };
  }, [progressPercentage]);

  const handleFilterClick = (filter: string) => {
    onFilterChange(filter);
  };

  const handleCloseFilters = () => {
    setShowFilters(false);
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="RoadMap">
      <div className="stats-container">
        <p className="CompletedStat">
          Технологий в статусе completed<br/>{learned}
        </p>
        <p className="InProgressStat">
          Технологий в статусе in-progress<br/>{inProgress}
        </p>
        <p className="NotStartStat">
          Технологий в статусе not-started<br/>{notStarted}
        </p>
      </div>
      <div className="progress-container">
        <div className="progress-bar-container">
          <div
            className={`progress-bar-fill ${isAnimating ? 'animated' : ''}`}
            style={{ width: `${displayedProgress}%` }}
          >
          </div>
        </div>
        <span className={`PercentText ${isAnimating ? 'animated' : ''}`}>
          {Math.round(displayedProgress)}%
        </span>
      </div>
      <div className = "filter-search-container">
          <div className = "search-window">
            <input
             className = "input-window"
             placeholder = "Введите запрос"
             value={searchQuery}
             onChange={handleSearchChange}
             />
            <FaSearch />
          </div>
          <div className="filter">
            <button
              className="filter-button"
              type="button"
              onClick={() => setShowFilters(!showFilters)}
            >
              <GiSettingsKnobs /> Фильтры
            </button>
          </div>
      </div>

      <Filters
        currentFilter={currentFilter}
        onFilterChange={handleFilterClick}
        isVisible={showFilters}
        onClose={handleCloseFilters}
      />
    </div>
  );
}

export { Card, RoadMap, QuickActions };
export default Card;
