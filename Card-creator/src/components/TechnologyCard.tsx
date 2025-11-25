import './TechnologyCard.css'; // Если CSS в той же папке components

function Card({ title, description, status }) {
  return (
    <div className="Card">
      <h2>{title}</h2>
      <p>{description}</p>
      <p>Статус: {status}</p>
    </div>
  );
}

export default Card;