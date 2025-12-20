import './TechnologyCard.css';
import { useState, useEffect, useRef } from 'react';
import { GiSettingsKnobs } from "react-icons/gi";
import { FaSearch } from "react-icons/fa";
import Modal from './Modal';

// Типы для статуса
type Status = 'completed' | 'in-progress' | 'not-started';

// Props для Card компонента
interface CardProps {
  title: string;
  description: string;
  status: Status;
  notes: string;
  techId: number;
  onStatusChange: (id: number) => void;
  onNotesChange: (techId: number, notes: string) => void;
  isEditable?: boolean;
  studyStartDate: string;
  studyEndDate?: string;
  isMassEditing?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
}

interface RoadMapProps {
  total: number;
  learned: number;
  notStarted: number;
  inProgress: number;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onSearch: (query: string) => void;
  searchResultsCount: number;
  searchQuery: string;
}

interface QuickActionsProps {
  onMarkAllDone: () => void;
  onResetAll: () => void;
  onRandomNext: () => void;
  onExportData?: () => string;
}

interface FiltersProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

// Функция для получения цвета по статусу
const getColorByStatus = (status: Status): string => {
  switch (status) {
    case 'completed': return '#4caf50';
    case 'in-progress': return '#ff9800';
    case 'not-started': return '#f44336';
    default: return '#f44336';
  }
};

// Функция для форматирования даты в формат 00.00.0000
const formatDateForDisplay = (dateString: string): string => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return '';
  }
};

function Card({
  title,
  description,
  status,
  notes,
  techId,
  onStatusChange,
  onNotesChange,
  isEditable = false,
  studyStartDate,
  studyEndDate,
  isMassEditing = false,
  isSelected = false,
  onSelect
}: CardProps) {
  const [localNotes, setLocalNotes] = useState(notes);
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardColor = getColorByStatus(status);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (isMassEditing && onSelect) {
      e.stopPropagation();
      onSelect(techId, !isSelected);
      return;
    }
    if (target.tagName === 'TEXTAREA' || target.closest('textarea')) {
      return;
    }
    onStatusChange(techId);
  };

  const handleTextareaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setLocalNotes(newNotes);

    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }

    notesTimeoutRef.current = setTimeout(() => {
      if (newNotes !== notes) {
        onNotesChange(techId, newNotes);
      }
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`Card ${isEditable ? 'editable-card' : ''} ${isMassEditing ? 'mass-edit-mode' : ''} ${isSelected ? 'selected-card' : ''}`}
      onClick={handleCardClick}
      style={{ backgroundColor: cardColor }}
      role={isMassEditing ? "checkbox" : "article"}
      aria-checked={isMassEditing ? isSelected : undefined}
      aria-label={`Карточка технологии: ${title}. Статус: ${status}.`}
      tabIndex={isMassEditing ? 0 : undefined}
      onKeyDown={(e) => {
        if (isMassEditing && onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(techId, !isSelected);
        }
      }}
    >
      {isMassEditing && (
        <div
          className="mass-edit-checkbox"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(techId, !isSelected);
          }}
        >
          <input
            type="checkbox"
            id={`select-${techId}`}
            checked={isSelected}
            onChange={(e) => onSelect?.(techId, e.target.checked)}
            aria-label={`Выбрать технологию: ${title}`}
          />
          <label htmlFor={`select-${techId}`} className="checkbox-label">
            ✓
          </label>
        </div>
      )}

      <h2 className="card-title">{title}</h2>
      <p className="card-description">{description}</p>
      <div className="status-container">
        <span className="status-label">Статус: </span>
        <span className="status-value">{status}</span>
      </div>

      {/* Блок сроков изучения в новом формате */}
      <div className="study-dates" aria-label="Сроки изучения технологии">
        {studyStartDate && studyEndDate ? (
          <span className="study-dates-text">
            {formatDateForDisplay(studyStartDate)} - {formatDateForDisplay(studyEndDate)}
          </span>
        ) : studyStartDate ? (
          <span className="study-dates-text">
            С {formatDateForDisplay(studyStartDate)}
          </span>
        ) : null}
      </div>

      <div className="notes-container">
        <label htmlFor={`notes-${techId}`} className="notes-label">
          Заметки:
        </label>
        <textarea
          id={`notes-${techId}`}
          className="note-text-area"
          value={localNotes}
          onClick={handleTextareaClick}
          onChange={handleTextareaChange}
          placeholder="Впишите сюда свою заметку..."
          rows={3}
          disabled={isMassEditing}
          aria-label="Поле для заметок о технологии"
          aria-describedby={`notes-hint-${techId}`}
        />
        <div id={`notes-hint-${techId}`} className="notes-hint">
          {localNotes.length > 0
            ? `Заметка сохранена (${localNotes.length} символов)`
            : ''
          }
        </div>
      </div>
    </div>
  );
}

function QuickActions({ onMarkAllDone, onResetAll, onRandomNext, onExportData }: QuickActionsProps) {
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExport = () => {
    if (onExportData) {
      onExportData();
      setShowExportModal(true);
    }
  };

  return (
    <>
      <div className="buttons-container">
        <button
          className="quick-actions-button"
          type="button"
          onClick={onMarkAllDone}
          aria-label="Отметить все технологии как изученные"
        >
          Отметить все как выполненные
        </button>
        <button
          className="quick-actions-button"
          type="button"
          onClick={onResetAll}
          aria-label="Сбросить статусы всех технологий"
        >
          Сбросить все статусы
        </button>
        <button
          className="quick-actions-button"
          type="button"
          onClick={onRandomNext}
          aria-label="Выбрать случайную технологию для изучения"
        >
          Случайный выбор следующей технологии
        </button>
        <button
          className="quick-actions-button"
          type="button"
          onClick={handleExport}
          aria-label="Экспортировать данные о технологиях"
        >
          Экспорт данных
        </button>
      </div>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Экспорт данных"
      >
        <p>Данные успешно экспортированы!</p>
        <p>Файл был автоматически загружен на ваш компьютер.</p>
        <p>Вы также можете просмотреть данные в консоли разработчика (F12).</p>
        <button onClick={() => setShowExportModal(false)}>
          Закрыть
        </button>
      </Modal>
    </>
  );
}

// Filters компонент
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
      role="menu"
      aria-label="Фильтры для технологий"
    >
      <div className="filters-list">
        <button
          className={`filters-text ${currentFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterClick('all')}
          aria-label="Показать все технологии"
          role="menuitem"
        >
          Все карточки
        </button>
        <button
          className={`filters-text ${currentFilter === 'not-started' ? 'active' : ''}`}
          onClick={() => handleFilterClick('not-started')}
          aria-label="Показать только не начатые технологии"
          role="menuitem"
        >
          Только не начатые
        </button>
        <button
          className={`filters-text ${currentFilter === 'in-progress' ? 'active' : ''}`}
          onClick={() => handleFilterClick('in-progress')}
          aria-label="Показать только технологии в процессе изучения"
          role="menuitem"
        >
          Только в процессе
        </button>
        <button
          className={`filters-text ${currentFilter === 'completed' ? 'active' : ''}`}
          onClick={() => handleFilterClick('completed')}
          aria-label="Показать только изученные технологии"
          role="menuitem"
        >
          Только завершенные
        </button>
      </div>
    </div>
  );
}

function RoadMap({
  total,
  learned,
  notStarted,
  inProgress,
  currentFilter,
  onFilterChange,
  onSearch,
  searchResultsCount,
  searchQuery
}: RoadMapProps) {
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const progressPercentage = total > 0 ? (learned / total) * 100 : 0;

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

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
    setLocalSearchQuery('');
    onSearch('');
  };

  const handleCloseFilters = () => {
    setShowFilters(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    if (value === '') {
      onSearch('');
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(localSearchQuery);
    }
  };

  const handleSearchIconClick = () => {
    onSearch(localSearchQuery);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    onSearch('');
  };

  return (
    <div className="RoadMap" role="region" aria-label="Статистика и управление технологиями">
      <div className="stats-container">
        <div className="stat-item" aria-label={`Изучено технологий: ${learned}`}>
          <p className="CompletedStat">
            Технологий в статусе <span className="completed-word">completed</span><br/>{learned}
          </p>
        </div>
        <div className="stat-item" aria-label={`Технологий в процессе изучения: ${inProgress}`}>
          <p className="InProgressStat">
            Технологий в статусе <span className="in-progress-word">in-progress</span><br/>{inProgress}
          </p>
        </div>
        <div className="stat-item" aria-label={`Не начатых технологий: ${notStarted}`}>
          <p className="NotStartStat">
            Технологий в статусе <span className="not-started-word">not-started</span><br/>{notStarted}
          </p>
        </div>
      </div>
      <div className="progress-container">
        <div className="progress-bar-container" role="progressbar" aria-valuenow={Math.round(displayedProgress)} aria-valuemin="0" aria-valuemax="100">
          <div
            className={`progress-bar-fill ${isAnimating ? 'animated' : ''}`}
            style={{ width: `${displayedProgress}%` }}
            aria-hidden="true"
          >
          </div>
        </div>
        <span className={`PercentText ${isAnimating ? 'animated' : ''}`} aria-live="polite">
          {Math.round(displayedProgress)}%
        </span>
      </div>
      <div className="filter-search-container">
        <div className="filter-section">
          <div className="filter">
            <button
              className="filter-button"
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-controls="filters-menu"
              aria-label={showFilters ? "Скрыть фильтры" : "Показать фильтры"}
            >
              <GiSettingsKnobs aria-hidden="true" /> Фильтры
            </button>
            <Filters
              currentFilter={currentFilter}
              onFilterChange={handleFilterClick}
              isVisible={showFilters}
              onClose={handleCloseFilters}
            />
          </div>
        </div>

        <div className="search-section">
          <div className="search-window">
            <input
              className="input-window"
              placeholder="Введите запрос и нажмите Enter"
              value={localSearchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              aria-label="Поиск технологий"
            />
            <FaSearch
              onClick={handleSearchIconClick}
              className="search-icon"
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchIconClick()}
              aria-label="Выполнить поиск"
            />
            {localSearchQuery && (
              <button
                onClick={handleClearSearch}
                className="clear-search"
                aria-label="Очистить поисковый запрос"
              >
                ×
              </button>
            )}
          </div>
          {searchQuery && searchQuery.trim() !== '' && (
            <div className="results-text" aria-live="polite">
              Найдено результатов: {searchResultsCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { Card, RoadMap, QuickActions };
export default Card;