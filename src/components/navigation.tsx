import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './navigation.css';
import { IoMdSettings } from "react-icons/io";
import { FaRegMoon } from "react-icons/fa";
import { FaSun } from "react-icons/fa";
import { FiMenu, FiX } from "react-icons/fi";
import logoDark from '/assets/WSLogo_dark.png';
import logoLight from '/assets/WSLogo.png';

function Navigation() {
  const location = useLocation();
  const [isWhiteTheme, setWhiteTheme] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (!currentTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      setWhiteTheme(false);
    } else if (currentTheme === 'light') {
      setWhiteTheme(true);
    } else {
      setWhiteTheme(false);
    }
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleChangeTheme = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    const nextTheme = isWhiteTheme ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', nextTheme);

    localStorage.setItem('theme', nextTheme);

    setTimeout(() => {
      setWhiteTheme(!isWhiteTheme);
      setIsAnimating(false);
    }, 300);
  }

  const getThemeButtonLabel = () => {
    return isWhiteTheme ? "Переключить на темную тему" : "Переключить на светлую тему";
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/">
            <img src={isWhiteTheme ? logoDark : logoLight} alt="логотип" />
            <h2 className="logo-text">Трекер технологий</h2>
          </Link>
        </div>

        <button
          className="nav-toggle"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
          title={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
        >
          {isMenuOpen ? <FiX /> : <FiMenu />}
        </button>

        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Главная
            </Link>
          </li>
          <li>
            <Link to="/technologies" className={location.pathname === '/technologies' ? 'active' : ''}>
              Все технологии
            </Link>
          </li>
          <li>
            <Link to="/add-technology" className={location.pathname === '/add-technology' ? 'active' : ''}>
              Добавить технологию
            </Link>
          </li>
          <li>
            <Link to="/stats" className={location.pathname === '/stats' ? 'active' : ''}>
              Статистика
            </Link>
          </li>
          <li>
            <Link to="/api-settings" className={location.pathname === '/api-settings' ? 'active' : ''}>
               API Настройки
            </Link>
          </li>
          <li>
            <Link to="/api-technologies" className={location.pathname === '/api-technologies' ? 'active' : ''}>
               Технологии из API
            </Link>
          </li>
          <li>
            <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
              <IoMdSettings />
              <span style={{ marginLeft: '8px' }}>Настройки</span>
            </Link>
          </li>
          <li>
            <button
              className="theme-toggle-button"
              onClick={handleChangeTheme}
              disabled={isAnimating}
              aria-label={getThemeButtonLabel()}
              title={getThemeButtonLabel()}
            >
              <div className="icon-container">
                <div className={`theme-icon icon-sun ${isWhiteTheme ? 'hiding' : ''}`}>
                  <FaSun />
                </div>
                <div className={`theme-icon icon-moon ${isWhiteTheme ? 'showing' : ''}`}>
                  <FaRegMoon />
                </div>
              </div>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;