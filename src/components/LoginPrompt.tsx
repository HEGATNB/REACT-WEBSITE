import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './LoginPrompt.css';

function LoginPrompt() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      try {
        await login(username.trim());
      } catch (error) {
        alert('Ошибка входа');
      }
    }
  };

  return (
    <div className="login-prompt">
      <div className="login-prompt-container">
        <div className="login-prompt-header">
          <h2>Добро пожаловать в Трекер технологий!</h2>
          <p>Войдите в свой аккаунт для доступа к персональным данным</p>
        </div>

        <div className="login-prompt-content">
          <form onSubmit={handleSubmit} className="login-prompt-form">
            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
                required
                autoFocus
              />
              <small className="form-hint">
                Если вы впервые здесь, будет создан новый аккаунт
              </small>
            </div>

            <button type="submit" className="login-submit-btn">
              Войти / Зарегистрироваться
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPrompt;