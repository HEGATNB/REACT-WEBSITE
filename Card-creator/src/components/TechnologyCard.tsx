import './TechnologyCard.css';

type Status = 'completed' | 'in-progress' | 'not-started';

interface CardProps {
  title: string;
  description: string;
  status: Status;
}

interface RoadMapProps {
  total: number;
  learned: number;
}

function Card({ title, description, status }: CardProps) {
  return (
    <div className="Card">
      <h2>{title}</h2>
      <p>{description}</p>
      <p>Статус: {status}</p>
    </div>
  );
}
function RoadMap({ total, learned }: RoadMapProps) {
  const progressPercentage = total > 0 ? (learned / total) * 100 : 0;

  return (
    <div className="RoadMap">
      <h2>Изучено: {learned} из {total}</h2>
      <progress
        className="progressBar"
        max="100"
        value={progressPercentage}
      ></progress>
      <span>{Math.round(progressPercentage)}%</span>
    </div>
  );
}
export { Card, RoadMap };
export default Card;