import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddTechnology.css';

interface Technology {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  notes: string;
  category?: string;
}

interface AddTechnologyProps {
  technologies: Technology[];
  setTechnologies: (techs: Technology[]) => void;
}

function AddTechnology({ technologies, setTechnologies }: AddTechnologyProps) {
  const navigate = useNavigate();
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [newTechnology, setNewTechnology] = useState({
    id: Date.now(),
    title: '',
    description: '',
    status: 'not-started' as const,
    notes: '',
    category: ''
  });

  const addButtonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleAddButtonClick = () => {
    if (!isCardVisible) {
      setIsCardVisible(true);
      setNewTechnology({
        id: Date.now(),
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

  const handleCloseCard = () => {
    setIsCardVisible(false);
  };

  const handleSaveNewTechnology = () => {
    if (!newTechnology.title.trim()) {
      alert('Пожалуйста, введите название технологии');
      return;
    }

    if (!newTechnology.description.trim()) {
      alert('Пожалуйста, введите описание технологии');
      return;
    }

    const techWithId = {
      ...newTechnology,
      id: technologies.length > 0 ? Math.max(...technologies.map(t => t.id)) + 1 : 1
    };

    const updatedTechnologies = [...technologies, techWithId];
    setTechnologies(updatedTechnologies);
    localStorage.setItem('techTrackerData', JSON.stringify(updatedTechnologies));

    alert(`Технология "${techWithId.title}" успешно добавлена!`);

    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  const handleCardClick = () => {
    const statusOrder: Array<'not-started' | 'in-progress' | 'completed'> = ['not-started', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(newTechnology.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;

    setNewTechnology(prev => ({
      ...prev,
      status: statusOrder[nextIndex]
    }));
  };

  const handleNotesChange = (notes: string) => {
    setNewTechnology(prev => ({
      ...prev,
      notes
    }));
  };

  const handleTitleChange = (value: string) => {
    setNewTechnology(prev => ({
      ...prev,
      title: value
    }));
  };

  const handleDescriptionChange = (value: string) => {
    setNewTechnology(prev => ({
      ...prev,
      description: value
    }));
  };

  const handleCategoryChange = (value: string) => {
    setNewTechnology(prev => ({
      ...prev,
      category: value
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCardVisible &&
          cardRef.current &&
          !cardRef.current.contains(event.target as Node) &&
          addButtonRef.current &&
          !addButtonRef.current.contains(event.target as Node)) {
        setIsCardVisible(false);
      }
    };

    if (isCardVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCardVisible]);

  const getStatusColor = () => {
    switch (newTechnology.status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#ff9800';
      case 'not-started': return '#666';
      default: return '#666';
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
            {isCardVisible ? '💾 Сохранить технологию' : '+ Создать новую технологию'}
          </button>
        </div>
        {isCardVisible && (
          <>
            <div
              className="modal-overlay-tech"
              onClick={handleCloseCard}
            />
            <div
              ref={cardRef}
              className="tech-card-editor"
              style={{ backgroundColor: getStatusColor() }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('input') || target.closest('textarea')) {
                  return;
                }
                handleCardClick();
              }}
            >
              <div className="card-inputs" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  placeholder="Название технологии *"
                  value={newTechnology.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="card-title-input"
                  autoFocus
                />

                <textarea
                  placeholder="Описание технологии *"
                  value={newTechnology.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  className="card-description-input"
                />

                <input
                  type="text"
                  placeholder="Категория (опционально)"
                  value={newTechnology.category || ''}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="card-category-input"
                />

                <textarea
                  placeholder="Заметки..."
                  value={newTechnology.notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  className="card-notes-input"
                  rows={3}
                />
              </div>

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

              <button
                onClick={handleCloseCard}
                className="card-close-button"
              >
                ×
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AddTechnology;