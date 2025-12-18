import React, { useState, useEffect } from 'react';
import './MassEditPanel.css';

// Типы
type Status = 'completed' | 'in-progress' | 'not-started';

interface Technology {
  id: number;
  title: string;
  status: Status;
}

interface MassEditPanelProps {
  selectedIds: number[];
  technologies: Technology[];
  onDelete: (ids: number[]) => void;
  onStatusChange: (ids: number[], status: Status) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const MassEditPanel: React.FC<MassEditPanelProps> = ({
  selectedIds,
  technologies,
  onDelete,
  onStatusChange,
  onCancel,
  isOpen
}) => {
  const [selectedAction, setSelectedAction] = useState<'delete' | 'status' | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Status>('in-progress');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCount = selectedIds.length;
  const selectedTechs = technologies.filter(tech => selectedIds.includes(tech.id));

  // Сброс состояния при закрытии
  useEffect(() => {
    if (!isOpen) {
      setSelectedAction(null);
      setSelectedStatus('in-progress');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Обработка клавиши Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (selectedAction === 'delete') {
      if (window.confirm(`Вы уверены, что хотите удалить ${selectedCount} выбранных технологий?`)) {
        setIsSubmitting(true);
        await onDelete(selectedIds);
        setIsSubmitting(false);
        onCancel();
      }
    } else if (selectedAction === 'status') {
      setIsSubmitting(true);
      await onStatusChange(selectedIds, selectedStatus);
      setIsSubmitting(false);
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    if (e.key === 'Enter' && selectedAction && selectedCount > 0 && !isSubmitting) {
      handleConfirm();
    }
  };

  return (
    <div
      className="mass-edit-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mass-edit-title"
      aria-describedby="mass-edit-description"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="mass-edit-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mass-edit-header">
          <h1 id="mass-edit-title" className="mass-edit-title">
            Массовое редактирование
          </h1>
          <button
            onClick={onCancel}
            className="mass-edit-close"
            aria-label="Закрыть панель массового редактирования"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <div className="mass-edit-content">
          <div id="mass-edit-description" className="mass-edit-description">
            <p>
              Выбрано технологий: <strong>{selectedCount}</strong>
            </p>
            {selectedCount > 0 && (
              <div className="selected-techs-info" aria-live="polite">
                <span className="sr-only">
                  Список выбранных технологий: {selectedTechs.map(t => t.title).join(', ')}
                </span>
              </div>
            )}
          </div>

          {selectedCount > 0 && (
            <div
              className="selected-list-container"
              role="region"
              aria-label="Список выбранных технологий"
            >
              <h3 className="selected-list-title">Выбранные технологии ({selectedCount}):</h3>
              <ul className="selected-list" aria-label="Список выбранных технологий">
                {selectedTechs.slice(0, 5).map(tech => (
                  <li
                    key={tech.id}
                    className="selected-list-item"
                    role="listitem"
                  >
                    <span className="tech-title">{tech.title}</span>
                    <span className="tech-status">({tech.status})</span>
                  </li>
                ))}
                {selectedCount > 5 && (
                  <li className="selected-list-item">
                    <span className="more-items">... и еще {selectedCount - 5} технологий</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="action-selection">
            <div className="action-buttons">
              <button
                className={`action-button ${selectedAction === 'delete' ? 'active' : ''}`}
                onClick={() => setSelectedAction('delete')}
                aria-pressed={selectedAction === 'delete'}
                disabled={isSubmitting}
              >
                <span className="action-icon">🗑️</span>
                <span className="action-text">Удалить выбранные</span>
              </button>
              <button
                className={`action-button ${selectedAction === 'status' ? 'active' : ''}`}
                onClick={() => setSelectedAction('status')}
                aria-pressed={selectedAction === 'status'}
                disabled={isSubmitting}
              >
                <span className="action-icon">🔄</span>
                <span className="action-text">Установить статус</span>
              </button>
            </div>

            {selectedAction === 'status' && (
              <div
                className="status-selection"
                role="radiogroup"
                aria-label="Выберите новый статус для технологий"
              >
                <h4 className="status-selection-title">Выберите новый статус:</h4>
                <div className="status-options">
                  <label className={`status-option ${selectedStatus === 'in-progress' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="mass-status"
                      value="in-progress"
                      checked={selectedStatus === 'in-progress'}
                      onChange={(e) => setSelectedStatus(e.target.value as Status)}
                      className="status-radio"
                      aria-label="Установить статус 'в процессе'"
                    />
                    <span className="status-indicator status-in-progress"></span>
                    <span className="status-label">В процессе</span>
                  </label>
                  <label className={`status-option ${selectedStatus === 'completed' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="mass-status"
                      value="completed"
                      checked={selectedStatus === 'completed'}
                      onChange={(e) => setSelectedStatus(e.target.value as Status)}
                      className="status-radio"
                      aria-label="Установить статус 'завершено'"
                    />
                    <span className="status-indicator status-completed"></span>
                    <span className="status-label">Завершено</span>
                  </label>
                  <label className={`status-option ${selectedStatus === 'not-started' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="mass-status"
                      value="not-started"
                      checked={selectedStatus === 'not-started'}
                      onChange={(e) => setSelectedStatus(e.target.value as Status)}
                      className="status-radio"
                      aria-label="Установить статус 'не начато'"
                    />
                    <span className="status-indicator status-not-started"></span>
                    <span className="status-label">Не начато</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="confirm-section">
            <button
              onClick={handleConfirm}
              disabled={!selectedAction || selectedCount === 0 || isSubmitting}
              className="confirm-button"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>Обработка...</span>
                </>
              ) : selectedAction === 'delete' ? (
                `Удалить (${selectedCount})`
              ) : selectedAction === 'status' ? (
                `Установить статус (${selectedCount})`
              ) : (
                'Подтвердить'
              )}
            </button>
            <button
              onClick={onCancel}
              className="cancel-button"
              disabled={isSubmitting}
            >
              Отмена
            </button>
          </div>

          <div className="accessibility-hint">
            <p className="sr-only">
              Для навигации используйте клавиши Tab и Shift+Tab. Для выбора используйте Enter или пробел.
              Для закрытия используйте Escape.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MassEditPanel;