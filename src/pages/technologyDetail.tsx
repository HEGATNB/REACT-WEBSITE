import { useParams, Link, useNavigate } from 'react-router-dom';
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
  studyEndDate: string;
  createdAt: string;
  updatedAt: string;
}

const getStatusColors = (status: Technology['status']) => {
  switch (status) {
    case 'completed':
      return {
        cardBg: '#2e7d32', // Средний зеленый
        cardBorder: '#00c853', // Неоново-зеленый (остался)
        inputBg: '#ffffff', // Чистый белый
        inputText: '#1b5e20', // Темно-зеленый текст
        inputBorder: '#4caf50', // Приглушенный зеленый вместо неонового

        buttonBg: '#1b5e20', // Темно-зеленый (был cardBg)
        buttonHover: '#2e7d32', // Средний зеленый
        buttonText: '#ffffff',

        labelColor: '#e8f5e9', // Светло-зеленый вместо белого
        sectionBg: '#388e3c', // Темнее чем фон, светлее чем кнопки

        accent: '#69f0ae',
        cancelBg: '#4caf50', // Средний зеленый
        cancelHover: '#2e7d32',
        cancelText: '#ffffff'
      };
    case 'in-progress':
      return {
        cardBg: '#ff8f00', // Средний оранжевый
        cardBorder: '#ff9100', // Ярко-оранжевый
        inputBg: '#ffffff', // Чистый белый
        inputText: '#e65100', // Темно-оранжевый текст
        inputBorder: '#ff9800', // Приглушенный оранжевый

        buttonBg: '#e65100', // Темно-оранжевый
        buttonHover: '#ff6f00', // Средний оранжевый
        buttonText: '#ffffff', // Белый текст вместо черного

        labelColor: '#fff3cd', // Светло-желтый вместо белого
        sectionBg: '#f57c00', // Темнее чем фон, светлее чем кнопки

        accent: '#ffd180',
        cancelBg: '#ff9800', // Основной оранжевый
        cancelHover: '#ff8f00',
        cancelText: '#212121' // Темный текст для контраста
      };
    case 'not-started':
    default:
      return {
        cardBg: '#d32f2f', // Средний красный
        cardBorder: '#ff5252', // Неоново-красный
        inputBg: '#ffffff', // Чистый белый
        inputText: '#b71c1c', // Темно-красный текст
        inputBorder: '#f44336', // Приглушенный красный

        buttonBg: '#b71c1c', // Темно-красный
        buttonHover: '#c62828', // Средний красный
        buttonText: '#ffffff',

        labelColor: '#ffebee', // Светло-красный вместо белого
        sectionBg: '#d32f2f', // Средний красный

        accent: '#ff8a80',
        cancelBg: '#f44336', // Основной красный
        cancelHover: '#d32f2f',
        cancelText: '#ffffff'
      };
  }
};

function TechnologyDetail() {
  const { techId } = useParams<{ techId: string }>();
  const navigate = useNavigate();
  const [technology, setTechnology] = useState<Technology | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Technology>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadTechnology();
  }, [techId]);

  const loadTechnology = () => {
    const saved = localStorage.getItem('techTrackerData');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved) as Technology[];
        const foundTech = parsedData.find(t => t.id === Number(techId));
        setTechnology(foundTech || null);
        if (foundTech) {
          const formattedData = {
            title: foundTech.title,
            description: foundTech.description,
            status: foundTech.status,
            notes: foundTech.notes || '',
            category: foundTech.category || '',
            studyStartDate: foundTech.studyStartDate,
            studyEndDate: foundTech.studyEndDate,
          };
          setFormData(formattedData);
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    }
    setIsLoading(false);
  };

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'title':
        if (!value || value.trim() === '') {
          return 'Название обязательно';
        }
        if (value.length < 2) {
          return 'Название должно быть не менее 2 символов';
        }
        if (value.length > 100) {
          return 'Название должно быть не более 100 символов';
        }
        return '';

      case 'description':
        if (!value || value.trim() === '') {
          return 'Описание обязательно';
        }
        if (value.length < 10) {
          return 'Описание должно быть не менее 10 символов';
        }
        return '';

      case 'status':
        if (!value) {
          return 'Статус обязателен';
        }
        return '';

      case 'studyStartDate':
        if (!value || value.trim() === '') {
          return 'Дата начала обязательна';
        }
        const startDate = new Date(value);
        if (isNaN(startDate.getTime())) {
          return 'Некорректная дата начала';
        }
        return '';

      case 'studyEndDate':
        if (!value || value.trim() === '') {
          return 'Дата окончания обязательна';
        }
        const endDate = new Date(value);
        if (isNaN(endDate.getTime())) {
          return 'Некорректная дата окончания';
        }
        if (formData.studyStartDate) {
          const startDate = new Date(formData.studyStartDate);
          if (endDate < startDate) {
            return 'Дата окончания не может быть раньше даты начала';
          }
        }
        return '';

      case 'category':
        if (value && value.length > 50) {
          return 'Категория должна быть не более 50 символов';
        }
        return '';

      default:
        return '';
    }
  };

  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ['title', 'description', 'status', 'studyStartDate', 'studyEndDate', 'category'];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };

    setFormData(newFormData);
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    const error = validateField(name, formData[name as keyof typeof formData]);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSave = () => {
    const allTouched = ['title', 'description', 'status', 'studyStartDate', 'studyEndDate', 'category']
      .reduce((acc, field) => ({ ...acc, [field]: true }), {});
    setTouched(allTouched);

    if (!validateAllFields() || !technology) return;

    setIsSaving(true);

    try {
      const saved = localStorage.getItem('techTrackerData');
      if (saved) {
        const parsedData = JSON.parse(saved) as Technology[];
        const updatedData = parsedData.map(tech => {
          if (tech.id === technology.id) {
            const updatedTech = {
              ...tech,
              ...formData,
              notes: formData.notes || '',
              category: formData.category || undefined,
              updatedAt: new Date().toISOString()
            } as Technology;
            return updatedTech;
          }
          return tech;
        });

        localStorage.setItem('techTrackerData', JSON.stringify(updatedData));
        setTimeout(() => {
          navigate('/technologies');
        }, 300);
      }
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      alert('Произошла ошибка при сохранении');
      setIsSaving(false);
    }
  };

  const currentStatus = formData.status || technology?.status || 'not-started';
  const colors = getStatusColors(currentStatus);

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
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          borderWidth: '2px',
          borderStyle: 'solid'
        }}
      >
        <div className="detail-header">
          <div className="edit-section">
            <div className="form-group">
              <label htmlFor="title" className="form-label" style={{ color: colors.labelColor }}>
                Название технологии <span className="required-star">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title || ''}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${errors.title ? 'input-error' : ''}`}
                placeholder="Введите название"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.inputText
                }}
              />
              {errors.title && <div className="error-message">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="status" className="form-label" style={{ color: colors.labelColor }}>
                Статус <span className="required-star">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={currentStatus}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-select ${errors.status ? 'input-error' : ''}`}
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.inputText
                }}
              >
                <option value="not-started">Не начато</option>
                <option value="in-progress">В процессе</option>
                <option value="completed">Завершено</option>
              </select>
              {errors.status && <div className="error-message">{errors.status}</div>}
            </div>
          </div>
        </div>

        <div
          className="detail-study-timeline"
          style={{
            backgroundColor: colors.sectionBg,
            borderColor: colors.inputBorder
          }}
        >
          <h3 className="section-title" style={{ color: colors.labelColor }}>Сроки изучения</h3>
          <div className="timeline-fields">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="studyStartDate" className="form-label" style={{ color: colors.labelColor }}>
                  Начало изучения <span className="required-star">*</span>
                </label>
                <input
                  type="date"
                  id="studyStartDate"
                  name="studyStartDate"
                  value={formData.studyStartDate || ''}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.studyStartDate ? 'input-error' : ''}`}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.inputText
                  }}
                />
                {errors.studyStartDate && <div className="error-message">{errors.studyStartDate}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="studyEndDate" className="form-label" style={{ color: colors.labelColor }}>
                  Планируемое окончание <span className="required-star">*</span>
                </label>
                <input
                  type="date"
                  id="studyEndDate"
                  name="studyEndDate"
                  value={formData.studyEndDate || ''}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.studyEndDate ? 'input-error' : ''}`}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.inputText
                  }}
                />
                {errors.studyEndDate && <div className="error-message">{errors.studyEndDate}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="category" className="form-label" style={{ color: colors.labelColor }}>Категория</label>
          <input
            id="category"
            name="category"
            type="text"
            value={formData.category || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`form-input ${errors.category ? 'input-error' : ''}`}
            placeholder="Например: Frontend, Backend и т.д."
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.inputText
            }}
          />
          {errors.category && <div className="error-message">{errors.category}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label" style={{ color: colors.labelColor }}>
            Описание <span className="required-star">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`form-textarea ${errors.description ? 'input-error' : ''}`}
            placeholder="Подробное описание технологии..."
            rows={4}
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.inputText
            }}
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="notes" className="form-label" style={{ color: colors.labelColor }}>Заметки</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="form-textarea"
            placeholder="Ваши заметки по изучению..."
            rows={3}
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.inputText
            }}
          />
        </div>

        <div className="detail-footer">
          <div className="detail-id" style={{
            color: colors.labelColor,
            backgroundColor: colors.sectionBg
          }}>
            ID: {technology.id}
          </div>

          <div className="form-actions">
            <button
              onClick={handleSave}
              className="save-button"
              disabled={isSaving}
              style={{
                backgroundColor: colors.buttonBg,
                color: colors.buttonText,
                borderColor: colors.buttonBg
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.buttonHover;
                e.currentTarget.style.borderColor = colors.buttonHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.buttonBg;
                e.currentTarget.style.borderColor = colors.buttonBg;
              }}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <Link
              to="/technologies"
              className="cancel-button"
              style={{
                backgroundColor: colors.cancelBg,
                borderColor: colors.inputBorder,
                color: colors.labelColor
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget;
                target.style.backgroundColor = colors.cancelHover;
                target.style.borderColor = colors.accent;
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget;
                target.style.backgroundColor = colors.cancelBg;
                target.style.borderColor = colors.inputBorder;
              }}
            >
              Отмена
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechnologyDetail;