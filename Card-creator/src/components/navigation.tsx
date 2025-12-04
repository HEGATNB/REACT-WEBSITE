import { Link, useLocation } from 'react-router-dom';
import './navigation.css';

  function Navigation() {
      const location = useLocation();
      return (
      <nav className="main-navigation">
        <div className="nav-container">
          <div className="nav-brand">
              <Link to="/">
              <img src="./WSLogo.png" alt="логотип" />
              <h2> Трекер технологий</h2>
              </Link>
          </div>
          <ul className="nav-menu">
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
          </ul>
        </div>
      </nav>
    );
}

export default Navigation;