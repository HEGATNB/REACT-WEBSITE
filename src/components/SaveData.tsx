import { useEffect } from 'react';

export const useSaveData = (technologies: any[], setTechnologies: (tech: any[]) => void) => {
  useEffect(() => {
    const saved = localStorage.getItem('techTrackerData');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setTechnologies(parsedData);
        console.log('Данные загружены из localStorage');
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    }
  }, [setTechnologies]);

  useEffect(() => {
    if (technologies && technologies.length > 0) {
      localStorage.setItem('techTrackerData', JSON.stringify(technologies));
      console.log('Данные сохранены в localStorage');
    }
  }, [technologies]);
};

export function TechnologyNotes({  }: {
  notes: string;
  onNotesChange: (id: number, notes: string) => void;
  techId: number;
}) {
  return (
    <div className="notes-section">
      <h4>Мои заметки:</h4>
    </div>
  );
}