import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './navigation.css';
import { IoMdSettings } from "react-icons/io";
import { FaRegMoon } from "react-icons/fa";
import { FaSun } from "react-icons/fa";
import { FiMenu, FiX } from "react-icons/fi";
import { GiAutoRepair } from "react-icons/gi";
import {FaHome, FaListAlt, FaPlusCircle, FaChartBar, FaCog, FaServer} from "react-icons/fa";
import logoDark from '/assets/WSLogo_dark.png';
import logoLight from '/assets/WSLogo.png';

function Navigation() {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Слушаем изменения темы
  useEffect(() => {
    const updateTheme = () => {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
      setTheme(savedTheme);
    };

    // Первоначальная установка
    updateTheme();

    // Слушаем изменения localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        updateTheme();
      }
    };

    // Слушаем кастомное событие для синхронизации между компонентами
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

    // Обновляем localStorage и атрибут
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);

    // Отправляем кастомное событие для синхронизации
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

  return (
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
  );
}

export default Navigation;