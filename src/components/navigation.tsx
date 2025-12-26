import { Link, useLocation } from 'react-router-dom';
import './navigation.css';
import { IoMdSettings } from "react-icons/io";
import { FaRegMoon } from "react-icons/fa";
import { FaSun } from "react-icons/fa";
import { FiMenu, FiX } from "react-icons/fi";
import { GiAutoRepair } from "react-icons/gi";
import { FaHome, FaListAlt, FaPlusCircle, FaChartBar, FaCog, FaServer, FaUserCircle, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import logoDark from '/assets/WSLogo_dark.png';
import logoLight from '/assets/WSLogo.png';
import { useAuth } from './AuthContext';
import { useState, useEffect } from 'react';

function Navigation() {
  const location = useLocation();
  const { user, isAuthenticated, logout, login } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const updateTheme = () => {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
      setTheme(savedTheme);
    };
    updateTheme();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        updateTheme();
      }
    };

    const handleThemeChange = () => {
      updateTheme();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themeChanged', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleChangeTheme = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    const nextTheme = theme === 'light' ? 'dark' : 'light';

    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);

    window.dispatchEvent(new CustomEvent('themeChanged'));

    setTimeout(() => {
      setTheme(nextTheme);
      setIsAnimating(false);
    }, 300);
  }

  const getThemeButtonLabel = () => {
    return theme === 'light' ? "Переключить на темную тему" : "Переключить на светлую тему";
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleAuthClick = () => {
    if (isAuthenticated) {
      logout();
    } else {
      setShowAuthModal(true);
      setAuthMode('login');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        await login(username);
      } else {
        await login(username);
      }
      setShowAuthModal(false);
      setUsername('');
      setPassword('');
      setEmail('');
    } catch (error) {
      alert('Ошибка аутентификации');
    }
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setUsername('');
    setPassword('');
    setEmail('');
  };

  return (
    <>
      <nav className="main-navigation">
        <div className="nav-container">
          <div className="nav-brand">
            <Link to="/">
              <img src={theme === 'light' ? logoDark : logoLight} alt="логотип" />
              <h2 className="logo-text">Трекер технологий</h2>
            </Link>
          </div>

          <div className="desktop-menu-container">
            <ul className="nav-menu desktop-menu">
              <li>
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                  <FaHome className="nav-icon" />
                  <span>Главная</span>
                </Link>
              </li>
              <li>
                <Link to="/technologies" className={location.pathname === '/technologies' ? 'active' : ''}>
                  <FaListAlt className="nav-icon" />
                  <span>Все технологии</span>
                </Link>
              </li>
              <li>
                <Link to="/add-technology" className={location.pathname === '/add-technology' ? 'active' : ''}>
                  <FaPlusCircle className="nav-icon" />
                  <span>Добавить</span>
                </Link>
              </li>
              <li>
                <Link to="/stats" className={location.pathname === '/stats' ? 'active' : ''}>
                  <FaChartBar className="nav-icon" />
                  <span>Статистика</span>
                </Link>
              </li>
              <li>
                <Link to="/api-settings" className={location.pathname === '/api-settings' ? 'active' : ''}>
                  <GiAutoRepair className="nav-icon" />
                  <span>API настройки</span>
                </Link>
              </li>
              <li>
                <Link to="/api-technologies" className={location.pathname === '/api-technologies' ? 'active' : ''}>
                  <FaServer className="nav-icon" />
                  <span>API технологии</span>
                </Link>
              </li>

              {/* Аватар/Кнопка входа */}
              <li className="auth-item">
                <button
                  className="auth-button"
                  onClick={handleAuthClick}
                  aria-label={isAuthenticated ? "Выйти из аккаунта" : "Войти в аккаунт"}
                  title={isAuthenticated ? "Выйти из аккаунта" : "Войти в аккаунт"}
                >
                  {isAuthenticated ? (
                    <>
                      <FaUserCircle className="nav-icon user-icon" />
                      <span className="username">{user?.username}</span>
                      <FaSignOutAlt className="nav-icon logout-icon" />
                    </>
                  ) : (
                    <>
                      <FaSignInAlt className="nav-icon login-icon" />
                      <span>Войти</span>
                    </>
                  )}
                </button>
              </li>

              <li className="theme-toggle-desktop">
                <button
                  className="theme-toggle-button"
                  onClick={handleChangeTheme}
                  disabled={isAnimating}
                  aria-label={getThemeButtonLabel()}
                  title={getThemeButtonLabel()}
                >
                  <div className="icon-container">
                    <div className={`theme-icon icon-sun ${theme === 'light' ? 'hiding' : ''}`}>
                      <FaSun />
                    </div>
                    <div className={`theme-icon icon-moon ${theme === 'light' ? 'showing' : ''}`}>
                      <FaRegMoon />
                    </div>
                  </div>
                </button>
              </li>
              <li>
                <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
                  <IoMdSettings className="nav-icon settings-icon" />
                </Link>
              </li>
            </ul>
          </div>

          <button
            className="nav-toggle"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
            title={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>

          <div className={`mobile-menu-container ${isMenuOpen ? 'active' : ''}`}>
            <div className="nav-menu-overlay" onClick={closeMenu}></div>
            <ul className={`nav-menu mobile-menu ${isMenuOpen ? 'active' : ''}`}>
              <li>
                <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={closeMenu}>
                  <FaHome className="nav-icon" />
                  <span>Главная</span>
                </Link>
              </li>
              <li>
                <Link to="/technologies" className={location.pathname === '/technologies' ? 'active' : ''} onClick={closeMenu}>
                  <FaListAlt className="nav-icon" />
                  <span>Все технологии</span>
                </Link>
              </li>
              <li>
                <Link to="/add-technology" className={location.pathname === '/add-technology' ? 'active' : ''} onClick={closeMenu}>
                  <FaPlusCircle className="nav-icon" />
                  <span>Добавить технологию</span>
                </Link>
              </li>
              <li>
                <Link to="/stats" className={location.pathname === '/stats' ? 'active' : ''} onClick={closeMenu}>
                  <FaChartBar className="nav-icon" />
                  <span>Статистика</span>
                </Link>
              </li>
              <li>
                <Link to="/api-settings" className={location.pathname === '/api-settings' ? 'active' : ''} onClick={closeMenu}>
                  <GiAutoRepair className="nav-icon" />
                  <span>API настройки</span>
                </Link>
              </li>
              <li>
                <Link to="/api-technologies" className={location.pathname === '/api-technologies' ? 'active' : ''} onClick={closeMenu}>
                  <FaServer className="nav-icon" />
                  <span>API технологии</span>
                </Link>
              </li>
              <li>
                <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''} onClick={closeMenu}>
                  <FaCog className="nav-icon" />
                  <span>Настройки</span>
                </Link>
              </li>
              <li className="auth-item-mobile">
                <button
                  className="auth-button"
                  onClick={handleAuthClick}
                  aria-label={isAuthenticated ? "Выйти из аккаунта" : "Войти в аккаунт"}
                  title={isAuthenticated ? "Выйти из аккаунта" : "Войти в аккаунт"}
                >
                  {isAuthenticated ? (
                    <>
                      <FaUserCircle className="nav-icon user-icon" />
                      <span className="username">{user?.username}</span>
                      <FaSignOutAlt className="nav-icon logout-icon" />
                    </>
                  ) : (
                    <>
                      <FaSignInAlt className="nav-icon login-icon" />
                      <span>Войти в аккаунт</span>
                    </>
                  )}
                </button>
              </li>

              <li className="theme-toggle-mobile">
                <button
                  className="theme-toggle-button"
                  onClick={handleChangeTheme}
                  disabled={isAnimating}
                  aria-label={getThemeButtonLabel()}
                  title={getThemeButtonLabel()}
                >
                  <div className="icon-container">
                    <div className={`theme-icon icon-sun ${theme === 'light' ? 'hiding' : ''}`}>
                      <FaSun className="nav-icon" />
                    </div>
                    <div className={`theme-icon icon-moon ${theme === 'light' ? 'showing' : ''}`}>
                      <FaRegMoon className="nav-icon" />
                    </div>
                  </div>
                  <span>Тема</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <h3>{authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}</h3>
              <button
                className="auth-modal-close"
                onClick={() => setShowAuthModal(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAuthSubmit} className="auth-form">
              <div className="auth-form-group">
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
              </div>

              {authMode === 'register' && (
                <div className="auth-form-group">
                  <label htmlFor="email">Email (опционально)</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Введите email"
                  />
                </div>
              )}

              <div className="auth-form-group">
                <label htmlFor="password">Пароль (опционально)</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                />
                <small className="password-hint">В текущей версии пароль не обязателен</small>
              </div>

              <button type="submit" className="auth-submit-btn">
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>

              <div className="auth-switch">
                <span>
                  {authMode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                </span>
                <button type="button" onClick={switchAuthMode} className="auth-switch-btn">
                  {authMode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Navigation;