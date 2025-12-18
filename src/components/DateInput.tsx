import React, { useState, useEffect } from 'react';
import './DateInput.css';

interface DateInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  studyStartDate: string; // Дата начала изучения (дата создания)
}

const DateInput: React.FC<DateInputProps> = ({
  id,
  label,
  value,
  onChange,
  minDate,
  maxDate,
  required = false,
  disabled = false,
  error,
  helpText,
  studyStartDate
}) => {
  const [localError, setLocalError] = useState<string>('');
  const [touched, setTouched] = useState(false);

  const validateDate = (dateValue: string) => {
    if (required && !dateValue) {
      return 'Дата окончания обязательна для заполнения';
    }

    if (dateValue) {
      const selectedDate = new Date(dateValue);
      const startDate = new Date(studyStartDate);

      // Проверка: дата окончания должна быть позже даты начала
      if (selectedDate <= startDate) {
        return 'Дата окончания должна быть позже даты начала изучения';
      }

      // Проверка на будущую дату (максимум +5 лет)
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 5);

      if (selectedDate > maxFutureDate) {
        return 'Дата окончания не может быть больше чем 5 лет вперед';
      }

      // Проверка на минимальную дату
      if (minDate && selectedDate < new Date(minDate)) {
        return `Дата не может быть раньше ${new Date(minDate).toLocaleDateString('ru-RU')}`;
      }

      // Проверка на максимальную дату
      if (maxDate && selectedDate > new Date(maxDate)) {
        return `Дата не может быть позже ${new Date(maxDate).toLocaleDateString('ru-RU')}`;
      }
    }

    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (touched) {
      const validationError = validateDate(newValue);
      setLocalError(validationError);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const validationError = validateDate(value);
    setLocalError(validationError);
  };

  const handleFocus = () => {
    // Автоматически установить минимальную дату как дату начала + 1 день
    if (!minDate && studyStartDate) {
      const minDateObj = new Date(studyStartDate);
      minDateObj.setDate(minDateObj.getDate() + 1);
      return minDateObj.toISOString().split('T')[0];
    }
    return minDate;
  };

  const displayError = error || localError;
  const isInvalid = !!displayError && touched;

  return (
    <div className={`date-input ${isInvalid ? 'invalid' : ''} ${disabled ? 'disabled' : ''}`}>
      <label htmlFor={id} className="date-input__label">
        {label}
        {required && <span className="required-asterisk" aria-hidden="true">*</span>}
      </label>

      <div className="date-input__wrapper">
        <input
          id={id}
          type="date"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => handleFocus()}
          min={handleFocus()}
          max={maxDate}
          required={required}
          disabled={disabled}
          aria-required={required}
          aria-invalid={isInvalid}
          aria-describedby={`${id}-help ${isInvalid ? `${id}-error` : ''}`}
          className="date-input__field"
        />

        {studyStartDate && (
          <div className="date-input__info" id={`${id}-dates-info`}>
            <span className="date-input__info-text">
              Дата начала: {new Date(studyStartDate).toLocaleDateString('ru-RU')}
            </span>
          </div>
        )}
      </div>

      {helpText && !isInvalid && (
        <div id={`${id}-help`} className="date-input__help-text">
          {helpText}
        </div>
      )}

      {isInvalid && (
        <div
          id={`${id}-error`}
          className="date-input__error-message"
          role="alert"
          aria-live="polite"
        >
          {displayError}
        </div>
      )}
    </div>
  );
};

export default DateInput;