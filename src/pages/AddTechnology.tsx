import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdClose } from "react-icons/io";
import './AddTechnology.css';
import useTechnologiesApi from '../components/TechnologiesApi';

interface AddTechnologyProps {
  technologies: any[];
  setTechnologies: (tech: any[]) => void;
}

function AddTechnology({ technologies, setTechnologies }: AddTechnologyProps) {
  const navigate = useNavigate();
  const [isCardVisible, setIsCardVisible] = useState(false);
  const { addTechnology } = useTechnologiesApi();

  const [newTechnology, setNewTechnology] = useState({
    title: '',
    description: '',
    status: 'not-started' as 'not-started' | 'in-progress' | 'completed',
    notes: '',
    category: ''
  });

  const addButtonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleAddButtonClick = () => {
    if (!isCardVisible) {
      setIsCardVisible(true);
      setNewTechnology({
        title: '',
        description: '',
        status: 'not-started',
        notes: '',
        category: ''
      });
    } else {
      handleSaveNewTechnology();
    }
  };

  const handleSaveNewTechnology = async () => {
    if (!newTechnology.title.trim()) {
      alert('Пожалуйста, введите название технологии');
      return;
    }

    if (!newTechnology.description.trim()) {
      alert('Пожалуйста, введите описание технологии');
      return;
    }

    try {
      await addTechnology({
        title: newTechnology.title.trim(),
        description: newTechnology.description.trim(),
        status: newTechnology.status,
        notes: newTechnology.notes.trim(),
        category: newTechnology.category.trim() || undefined
      });

      alert(`Технология "${newTechnology.title}" успешно добавлена!`);
      setNewTechnology({
        title: '',
        description: '',
        status: 'not-started',
        notes: '',
        category: ''
      });
      setIsCardVisible(false);
      navigate('/');
    } catch (err) {
      alert(`Ошибка при добавлении: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.card-close-button')) {
      return;
    }
    if (
      (e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA' ||
      (e.target as HTMLElement).closest('input') ||
      (e.target as HTMLElement).closest('textarea')
    ) {
      return;
    }

    const statusOrder: Array<'not-started' | 'in-progress' | 'completed'> = ['not-started', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(newTechnology.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;

    setNewTechnology(prev => ({
      ...prev,
      status: statusOrder[nextIndex]
    }));
  };

  const handleCloseCard = () => {
    setIsCardVisible(false);
  };

  const getStatusColor = () => {
    switch (newTechnology.status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#ff9800';
      case 'not-started': return '#f44336';
      default: return '#f44336';
    }
  };

  const getStatusText = () => {
    switch (newTechnology.status) {
      case 'completed': return 'Завершено';
      case 'in-progress': return 'В процессе';
      case 'not-started': return 'Не начато';
      default: return 'Не начато';
    }
  };

  return (
    <div className="add-technology-page">
      <div className="add-tech-content">
        <div className="add-button-container">
          <button
            ref={addButtonRef}
            onClick={handleAddButtonClick}
            className={`add-tech-button ${isCardVisible ? 'save-mode' : ''}`}
          >
            {isCardVisible ? 'Сохранить технологию' : '+ Создать новую технологию'}
          </button>
        </div>

        {isCardVisible && (
          <div
            ref={cardRef}
            className="tech-card-editor"
            style={{ backgroundColor: getStatusColor() }}
            onClick={handleCardClick}
          >
            {/* Кнопка закрытия */}
            <button
              className="card-close-button"
              onClick={handleCloseCard}
              aria-label="Закрыть"
            >
              <IoMdClose />
            </button>

            {/* Статус перенесен вверх */}
            <div className="card-status-info">
              <div className="status-text">
                Статус: {getStatusText()}
              </div>
              <div className="card-hint">
                Нажмите на карточку, чтобы изменить статус
              </div>
              <div className="card-hint">
                Кликните на поле, чтобы редактировать текст
              </div>
            </div>

            <div className="card-inputs" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                placeholder="Название технологии *"
                value={newTechnology.title}
                onChange={(e) => setNewTechnology(prev => ({...prev, title: e.target.value}))}
                className="card-title-input"
                autoFocus
              />

              <textarea
                placeholder="Описание технологии *"
                value={newTechnology.description}
                onChange={(e) => setNewTechnology(prev => ({...prev, description: e.target.value}))}
                className="card-description-input"
              />

              <input
                type="text"
                placeholder="Категория (опционально)"
                value={newTechnology.category}
                onChange={(e) => setNewTechnology(prev => ({...prev, category: e.target.value}))}
                className="card-category-input"
              />

              <textarea
                placeholder="Заметки..."
                value={newTechnology.notes}
                onChange={(e) => setNewTechnology(prev => ({...prev, notes: e.target.value}))}
                className="card-notes-input"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddTechnology;