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
            notes: foundTech.notes,
            category: foundTech.category,
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

    // Динамическая валидация при изменении
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

    // Валидация при потере фокуса
    const error = validateField(name, formData[name as keyof typeof formData]);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSave = () => {
    // Помечаем все поля как touched перед валидацией
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
              studyEndDate: formData.studyEndDate || tech.studyEndDate, // Гарантируем наличие даты окончания
              updatedAt: new Date().toISOString()
            } as Technology;
            return updatedTech;
          }
          return tech;
        });

        localStorage.setItem('techTrackerData', JSON.stringify(updatedData));

        // Обновляем локальное состояние и возвращаемся к списку
        const updatedTech = updatedData.find(t => t.id === technology.id);
        setTechnology(updatedTech || null);

        setTimeout(() => {
          navigate('/technologies');
        }, 500);
      }
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      alert('Произошла ошибка при сохранении');
      setIsSaving(false);
    }
  };

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

  const currentStatus = formData.status || technology.status;

  return (
    <div className="technology-detail-page">
      <div className="detail-back-button">
        <Link to="/technologies">← Назад к списку</Link>
      </div>

      <div
        className="technology-detail-card"
        style={{ backgroundColor: getColorByStatus(currentStatus) }}
      >
        <div className="detail-header">
          <div className="edit-section">
            <div className="form-group">
              <label htmlFor="title" className="form-label">
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
              />
              {errors.title && <div className="error-message">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Статус <span className="required-star">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={currentStatus}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-select ${errors.status ? 'input-error' : ''}`}
              >
                <option value="not-started">Не начато</option>
                <option value="in-progress">В процессе</option>
                <option value="completed">Завершено</option>
              </select>
              {errors.status && <div className="error-message">{errors.status}</div>}
            </div>
          </div>
        </div>

        <div className="detail-study-timeline">
          <h3 className="section-title">Сроки изучения</h3>
          <div className="timeline-fields">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="studyStartDate" className="form-label">
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
                />
                {errors.studyStartDate && <div className="error-message">{errors.studyStartDate}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="studyEndDate" className="form-label">
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
                />
                {errors.studyEndDate && <div className="error-message">{errors.studyEndDate}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="category" className="form-label">Категория</label>
          <input
            id="category"
            name="category"
            type="text"
            value={formData.category || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`form-input ${errors.category ? 'input-error' : ''}`}
            placeholder="Например: Frontend, Backend и т.д."
          />
          {errors.category && <div className="error-message">{errors.category}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
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
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="notes" className="form-label">Заметки</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="form-textarea"
            placeholder="Ваши заметки по изучению..."
            rows={3}
          />
        </div>

        <div className="detail-footer">
          <div className="detail-id">
            ID: {technology.id}
          </div>

          <div className="form-actions">
            <button
              onClick={handleSave}
              className="save-button"
              disabled={isSaving}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <Link to="/technologies" className="cancel-button">
              Отмена
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechnologyDetail;