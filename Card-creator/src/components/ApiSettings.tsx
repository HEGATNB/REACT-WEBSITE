import { useState } from 'react';
import useTechnologiesApi from './TechnologiesApi';
import './ApiSettings.css';

function ApiSettings() {
  const {
    apiEndpoint,
    saveApiEndpoint,
    importRoadmap,
    loading,
    error,
    syncWithApi
  } = useTechnologiesApi();

  const [newEndpoint, setNewEndpoint] = useState(apiEndpoint || '');
  const [roadmapUrl, setRoadmapUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSaveEndpoint = () => {
    if (newEndpoint.trim()) {
      saveApiEndpoint(newEndpoint.trim());
      alert('API эндпоинт сохранен');
    }
  };

  const handleImportRoadmap = async () => {
    if (!roadmapUrl.trim()) {
      alert('Введите URL дорожной карты');
      return;
    }

    try {
      const result = await importRoadmap(roadmapUrl);
      alert(`Успешно импортировано ${result.importedCount} из ${result.totalCount} технологий`);
      setRoadmapUrl('');
    } catch (err) {
      alert(`Ошибка импорта: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage('Синхронизация...');

      await syncWithApi();
      setSyncMessage('Данные успешно синхронизированы!');

      setTimeout(() => setSyncMessage(''), 3000);
    } catch (err) {
      setSyncMessage(`Ошибка синхронизации: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUseExampleApi = () => {
    setNewEndpoint('https://your-app-name.onrender.com/api/technologies');
    alert('Пример API эндпоинта добавлен. Замените "your-app-name" на имя вашего приложения на Render.com');
  };

  const handleUseMockApi = () => {
    setNewEndpoint('https://my-json-server.typicode.com/your-username/your-repo/technologies');
    alert('Мок API эндпоинт добавлен. Замените на ваш реальный эндпоинт когда будет готов бэкенд');
  };

  return (
    <div className="api-settings">
      <h2>Настройки API</h2>

      <div className="api-section">
        <h3>API Эндпоинт</h3>
        <div className="endpoint-control">
          <input
            type="text"
            value={newEndpoint}
            onChange={(e) => setNewEndpoint(e.target.value)}
            placeholder="https://your-api.onrender.com/api/technologies"
            className="endpoint-input"
          />
          <button onClick={handleSaveEndpoint} className="save-btn">
            Сохранить
          </button>
        </div>

        <div className="api-examples">
          <p className="examples-title">Примеры:</p>
          <button onClick={handleUseExampleApi} className="example-btn">
            Пример Render.com API
          </button>
          <button onClick={handleUseMockApi} className="example-btn">
            Пример мок API
          </button>
        </div>

        <div className="current-endpoint">
          <p><strong>Текущий эндпоинт:</strong></p>
          <code>{apiEndpoint || 'Не настроен'}</code>
        </div>
      </div>

      <div className="api-section">
        <h3>Импорт дорожной карты</h3>
        <div className="roadmap-control">
          <input
            type="text"
            value={roadmapUrl}
            onChange={(e) => setRoadmapUrl(e.target.value)}
            placeholder="https://api.example.com/roadmaps/frontend"
            className="roadmap-input"
          />
          <button
            onClick={handleImportRoadmap}
            className="import-btn"
            disabled={loading}
          >
            {loading ? 'Импорт...' : 'Импортировать'}
          </button>
        </div>
        <p className="roadmap-hint">
          Укажите URL к API, который возвращает дорожную карту в формате JSON
        </p>

        <div className="example-roadmaps">
          <p><strong>Примеры дорожных карт:</strong></p>
          <ul>
            <li onClick={() => setRoadmapUrl('https://roadmap.sh/frontend.json')}>
              Frontend Roadmap
            </li>
            <li onClick={() => setRoadmapUrl('https://roadmap.sh/backend.json')}>
              Backend Roadmap
            </li>
            <li onClick={() => setRoadmapUrl('https://api.github.com/repos/kamranahmedse/developer-roadmap/contents')}>
              Developer Roadmaps
            </li>
          </ul>
        </div>
      </div>

      <div className="api-section">
        <h3>Синхронизация</h3>
        <button
          onClick={handleSync}
          className="sync-btn"
          disabled={isSyncing || !apiEndpoint}
        >
          {isSyncing ? 'Синхронизация...' : 'Синхронизировать с API'}
        </button>
        {syncMessage && (
          <div className={`sync-message ${syncMessage.includes('Ошибка') ? 'error' : 'success'}`}>
            {syncMessage}
          </div>
        )}
        <p className="sync-hint">
          Синхронизирует локальные данные с сервером
        </p>
      </div>

      {error && (
        <div className="api-error">
          <p><strong>Ошибка API:</strong> {error}</p>
        </div>
      )}
    </div>
  );
}

export default ApiSettings;