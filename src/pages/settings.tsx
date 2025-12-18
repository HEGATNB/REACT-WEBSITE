import { useState, useEffect } from 'react';
import './settings.css';
import { FaRegMoon } from "react-icons/fa";
import { FaSun } from "react-icons/fa";

function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [animations, setAnimations] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme as 'light' | 'dark');

    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications !== null) {
      setNotifications(JSON.parse(savedNotifications));
    }
    
    const savedAutoSave = localStorage.getItem('autoSave');
    if (savedAutoSave !== null) {
      setAutoSave(JSON.parse(savedAutoSave));
    }
    
    const savedAnimations = localStorage.getItem('animations');
    if (savedAnimations !== null) {
      setAnimations(JSON.parse(savedAnimations));
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
  setTheme(newTheme);
  localStorage.setItem('theme', newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
  window.dispatchEvent(new CustomEvent('themeChanged'));
};

  const handleNotificationsChange = (value: boolean) => {
    setNotifications(value);
    localStorage.setItem('notifications', JSON.stringify(value));
  };

  const handleAutoSaveChange = (value: boolean) => {
    setAutoSave(value);
    localStorage.setItem('autoSave', JSON.stringify(value));
  };

  const handleAnimationsChange = (value: boolean) => {
    setAnimations(value);
    localStorage.setItem('animations', JSON.stringify(value));
    
    if (!value) {
      document.documentElement.style.setProperty('--animation-speed', '0s');
    } else {
      document.documentElement.style.removeProperty('--animation-speed');
    }
  };

  const resetStatistics = () => {
    if (confirm('Вы уверены, что хотите сбросить всю статистику? Это действие нельзя отменить.')) {
      localStorage.removeItem('techTrackerData');
      alert('Статистика успешно сброшена. Страница будет перезагружена.');
      window.location.reload();
    }
  };

  const clearAllData = () => {
    if (confirm('ВНИМАНИЕ: Это удалит ВСЕ данные приложения, включая все технологии и настройки. Продолжить?')) {
      localStorage.clear();
      alert('Все данные очищены. Страница будет перезагружена.');
      window.location.reload();
    }
  };

  const exportData = () => {
    const data = localStorage.getItem('techTrackerData');
    if (!data) {
      alert('Нет данных для экспорта');
      return;
    }
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tech-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          localStorage.setItem('techTrackerData', JSON.stringify(data));
          alert('Данные успешно импортированы! Страница будет перезагружена.');
          window.location.reload();
        } catch (error) {
          alert('Ошибка: неверный формат файла');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Настройки</h1>
        
        <div className="settings-section">
          <h2 className="section-title">Внешний вид</h2>
          <div className="settings-group">
            <div className="setting-item">
              <label className="setting-label">Тема</label>
              <div className="theme-switcher">
                <button 
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <FaSun /> Светлая
                </button>
                <button 
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <FaRegMoon /> Тёмная
                </button>
              </div>
            </div>
            
            <div className="setting-item">
              <label className="setting-label">Анимации</label>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={animations}
                  onChange={(e) => handleAnimationsChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {animations ? 'Включены' : 'Выключены'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="section-title">Поведение</h2>
          <div className="settings-group">
            <div className="setting-item">
              <label className="setting-label">Уведомления</label>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={notifications}
                  onChange={(e) => handleNotificationsChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {notifications ? 'Включены' : 'Выключены'}
                </span>
              </label>
            </div>
            
            <div className="setting-item">
              <label className="setting-label">Автосохранение</label>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={autoSave}
                  onChange={(e) => handleAutoSaveChange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {autoSave ? 'Включено' : 'Выключено'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="section-title">Управление данными</h2>
          <div className="settings-group">
            <div className="setting-item">
              <label className="setting-label">Экспорт данных</label>
              <button className="data-btn export-btn" onClick={exportData}>
                📤 Экспортировать в JSON
              </button>
            </div>
            
            <div className="setting-item">
              <label className="setting-label">Импорт данных</label>
              <button className="data-btn import-btn" onClick={importData}>
                📥 Импортировать из JSON
              </button>
            </div>
            
            <div className="setting-item">
              <label className="setting-label">Сброс статистики</label>
              <button className="data-btn reset-btn" onClick={resetStatistics}>
                🔄 Сбросить статистику
              </button>
            </div>
            
            <div className="setting-item">
              <label className="setting-label">Очистка всех данных</label>
              <button className="data-btn clear-btn" onClick={clearAllData}>
                🗑️ Очистить всё
              </button>
            </div>
          </div>
        </div>

        <div className="settings-info">
          <p className="info-text">
            Приложение сохраняет все данные локально в вашем браузере.
            Экспортируйте данные для резервного копирования.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;