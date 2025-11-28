import './TechnologyCard.css';
import { useState, useEffect } from 'react';

type Status = 'completed' | 'in-progress' | 'not-started';

interface CardProps {
  title: string;
  description: string;
  status: Status;
  onStatusChange: () => void;
}

interface RoadMapProps {
  total: number;
  learned: number;
}

function Card({ title, description, status, onStatusChange }: CardProps) {
  return (
    <div className="Card" onClick={onStatusChange}>
      <h2>{title}</h2>
      <p>{description}</p>
      <p>Статус: {status}</p>
    </div>
  );
}

function RoadMap({ total, learned }: RoadMapProps) {
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const progressPercentage = total > 0 ? (learned / total) * 100 : 0;

  useEffect(() => {
    // Запускаем анимацию при изменении прогресса
    setIsAnimating(true);

    const progressTimer = setTimeout(() => {
      setDisplayedProgress(progressPercentage);
    }, 10);

    const animationTimer = setTimeout(() => {
      setIsAnimating(false);
    }, 800); // Время должно совпадать с duration transition

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(animationTimer);
    };
  }, [progressPercentage]);

  return (
    <div className="RoadMap">
      <h2>Изучено: {learned} из {total}</h2>
      <div className="progress-container">
        <div className="progress-bar-container">
          <div
            className={`progress-bar-fill ${isAnimating ? 'animated' : ''}`}
            style={{ width: `${displayedProgress}%` }}
          ></div>
        </div>
        <span className={`PercentText ${isAnimating ? 'animated' : ''}`}>
          {Math.round(displayedProgress)}%
        </span>
      </div>
    </div>
  );
}

export { Card, RoadMap };
export default Card;