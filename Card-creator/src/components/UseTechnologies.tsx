import { useState, useEffect } from 'react';

export interface Technology {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  notes: string;
  category?: string;
}

const initialTechnologies: Technology[] = [
  {
    id: 1,
    title: 'React Components',
    description: 'Изучение базовых компонентов',
    status: 'not-started',
    notes: '',
    category: 'frontend'
  },
  {
    id: 2,
    title: 'Node.js Basics',
    description: 'Основы серверного JavaScript',
    status: 'not-started',
    notes: '',
    category: 'backend'
  },
  {
    id: 3,
    title: 'State Management',
    description: 'Работа с состоянием компонентов',
    status: 'not-started',
    notes: '',
    category: 'frontend'
  },
  {
    id: 4,
    title: 'Express.js',
    description: 'Создание серверных приложений',
    status: 'not-started',
    notes: '',
    category: 'backend'
  },
  {
    id: 5,
    title: 'TypeScript',
    description: 'Типизированный JavaScript',
    status: 'not-started',
    notes: '',
    category: 'frontend'
  }
];

function useTechnologies() {
  const [technologies, setTechnologies] = useState<Technology[]>(() => {
    const saved = localStorage.getItem('techTrackerData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        return initialTechnologies;
      }
    }
    return initialTechnologies;
  });

  useEffect(() => {
    localStorage.setItem('techTrackerData', JSON.stringify(technologies));
  }, [technologies]);

  const updateStatus = (techId: number, newStatus: Technology['status']) => {
    setTechnologies(prev =>
      prev.map(tech =>
        tech.id === techId ? { ...tech, status: newStatus } : tech
      )
    );
  };

  const updateNotes = (techId: number, newNotes: string) => {
    setTechnologies(prev =>
      prev.map(tech =>
        tech.id === techId ? { ...tech, notes: newNotes } : tech
      )
    );
  };

  const calculateProgress = () => {
    if (technologies.length === 0) return 0;
    const completed = technologies.filter(tech => tech.status === 'completed').length;
    return Math.round((completed / technologies.length) * 100);
  };

  const markAllDone = () => {
    setTechnologies(prev =>
      prev.map(tech => ({
        ...tech,
        status: 'completed' as const
      }))
    );
  };

  const resetAllStatuses = () => {
    setTechnologies(prev =>
      prev.map(tech => ({
        ...tech,
        status: 'not-started' as const
      }))
    );
  };

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      technologies: technologies
    };
    const dataStr = JSON.stringify(data, null, 2);
    console.log('Данные для экспорта:', dataStr);

    // Создаем ссылку для скачивания файла
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tech-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return dataStr;
  };

  return {
    technologies,
    updateStatus,
    updateNotes,
    progress: calculateProgress(),
    markAllDone,
    resetAllStatuses,
    exportData,
    setTechnologies
  };
}

export default useTechnologies;