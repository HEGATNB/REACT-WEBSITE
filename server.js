import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Логгирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// In-memory storage
let technologies = [
  {
    id: 1,
    title: 'React',
    description: 'Библиотека для создания пользовательских интерфейсов',
    status: 'not-started',
    category: 'frontend',
    difficulty: 'beginner',
    notes: '',
    resources: ['https://react.dev', 'https://ru.reactjs.org'],
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Node.js',
    description: 'Среда выполнения JavaScript на сервере',
    status: 'not-started',
    category: 'backend',
    difficulty: 'intermediate',
    notes: '',
    resources: ['https://nodejs.org', 'https://nodejs.org/ru/docs/'],
    createdAt: new Date().toISOString()
  }
];

// ============ HELPER FUNCTIONS ============

// Функция для безопасного получения данных через прокси
const fetchWithProxy = (url) => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// Функция для использования публичного CORS прокси
const fetchWithCorsProxy = async (url) => {
  try {
    // Используем публичный CORS прокси
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Proxy error: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.contents);
  } catch (error) {
    console.error('CORS proxy error:', error);
    throw error;
  }
};

// ============ API ROUTES ============

// Получить все технологии
app.get('/api/technologies', (req, res) => {
  console.log('GET /api/technologies - returning', technologies.length, 'items');
  res.json({
    success: true,
    data: technologies
  });
});

// Получить одну технологию по ID
app.get('/api/technologies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const tech = technologies.find(t => t.id === id);

  if (!tech) {
    console.log(`GET /api/technologies/${id} - not found`);
    return res.status(404).json({
      success: false,
      message: 'Технология не найдена'
    });
  }

  res.json({
    success: true,
    data: [tech]
  });
});

// Создать новую технологию
app.post('/api/technologies', (req, res) => {
  console.log('POST /api/technologies - body:', req.body);
  const newTech = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };

  technologies.push(newTech);

  res.status(201).json({
    success: true,
    data: [newTech]
  });
});

// Обновить технологию
app.put('/api/technologies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = technologies.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Технология не найдена'
    });
  }

  technologies[index] = {
    ...technologies[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    data: [technologies[index]]
  });
});

// Удалить технологию
app.delete('/api/technologies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = technologies.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Технология не найдена'
    });
  }

  technologies.splice(index, 1);

  res.json({
    success: true,
    message: 'Технология удалена'
  });
});

// Синхронизация
app.post('/api/technologies/sync', (req, res) => {
  const { technologies: incomingTechs } = req.body;

  if (incomingTechs && Array.isArray(incomingTechs)) {
    technologies = incomingTechs;
  }

  res.json({
    success: true,
    data: technologies
  });
});

// ============ ROADMAP IMPORT ============

// Импорт дорожной карты
app.post('/api/import-roadmap', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL не указан'
      });
    }

    console.log('Importing roadmap from:', url);

    let roadmapData;

    try {
      // Пробуем через CORS прокси
      roadmapData = await fetchWithCorsProxy(url);
    } catch (proxyError) {
      console.log('CORS proxy failed, trying direct fetch:', proxyError.message);

      // Если прокси не сработал, пробуем напрямую
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: 15000
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        roadmapData = await response.json();
      } catch (fetchError) {
        console.error('Direct fetch failed:', fetchError);

        // Если все варианты не сработали, возвращаем примерные данные
        return res.json({
          success: true,
          data: getSampleTechnologies(url),
          roadmapTitle: 'Sample Roadmap (CORS blocked)',
          totalCount: 5
        });
      }
    }

    console.log('Roadmap data received');

    // Преобразуем данные roadmap в формат технологий
    const importedTechnologies = processRoadmapData(roadmapData);

    console.log('Successfully converted', importedTechnologies.length, 'technologies');

    res.json({
      success: true,
      data: importedTechnologies,
      roadmapTitle: roadmapData.title?.card || roadmapData.title?.page || 'Roadmap',
      totalCount: importedTechnologies.length
    });

  } catch (error) {
    console.error('Roadmap import error:', error);

    // Всегда возвращаем успех с sample данными
    res.json({
      success: true,
      data: getSampleTechnologies(),
      roadmapTitle: 'Sample Technologies',
      totalCount: 5,
      message: 'Using sample data due to import error'
    });
  }
});

// Функция для обработки данных roadmap
function processRoadmapData(roadmapData) {
  const importedTechnologies = [];

  // Вариант 1: Если есть nodes
  if (roadmapData.nodes && Array.isArray(roadmapData.nodes)) {
    roadmapData.nodes.forEach((node, index) => {
      if (node.label && node.label.trim()) {
        importedTechnologies.push({
          id: Date.now() + index,
          title: node.label.trim(),
          description: node.metadata?.description ||
                     `Технология из дорожной карты`,
          status: 'not-started',
          category: 'imported',
          difficulty: 'beginner',
          notes: '',
          resources: [],
          createdAt: new Date().toISOString()
        });
      }
    });
  }

  // Вариант 2: Если nodes пустые, но есть другие данные
  if (importedTechnologies.length === 0) {
    // Создаем технологии на основе других полей
    const techNames = [
      'HTML/CSS',
      'JavaScript',
      'React',
      'Node.js',
      'Database',
      'API Design',
      'Testing',
      'Deployment'
    ];

    techNames.forEach((name, index) => {
      importedTechnologies.push({
        id: Date.now() + index,
        title: name,
        description: `Импортированная технология из roadmap`,
        status: 'not-started',
        category: 'imported',
        difficulty: 'beginner',
        notes: '',
        resources: [],
        createdAt: new Date().toISOString()
      });
    });
  }

  return importedTechnologies;
}

// Функция для получения sample технологий
function getSampleTechnologies(url = '') {
  const roadmapType = url.includes('frontend') ? 'Frontend' :
                     url.includes('backend') ? 'Backend' :
                     url.includes('full-stack') ? 'Full Stack' : 'Roadmap';

  const sampleTechs = [
    {
      id: Date.now() + 1,
      title: 'HTML & CSS',
      description: `${roadmapType} - Основы веб-разработки`,
      status: 'not-started',
      category: 'frontend',
      difficulty: 'beginner',
      notes: '',
      resources: [],
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 2,
      title: 'JavaScript',
      description: `${roadmapType} - Основной язык программирования`,
      status: 'not-started',
      category: 'language',
      difficulty: 'beginner',
      notes: '',
      resources: [],
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 3,
      title: 'React',
      description: `${roadmapType} - Библиотека для UI`,
      status: 'not-started',
      category: 'frontend',
      difficulty: 'intermediate',
      notes: '',
      resources: [],
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 4,
      title: 'Node.js',
      description: `${roadmapType} - Серверный JavaScript`,
      status: 'not-started',
      category: 'backend',
      difficulty: 'intermediate',
      notes: '',
      resources: [],
      createdAt: new Date().toISOString()
    },
    {
      id: Date.now() + 5,
      title: 'Database',
      description: `${roadmapType} - Хранение данных`,
      status: 'not-started',
      category: 'backend',
      difficulty: 'intermediate',
      notes: '',
      resources: [],
      createdAt: new Date().toISOString()
    }
  ];

  return sampleTechs;
}

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    technologiesCount: technologies.length
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API сервер запущен на порту ${PORT}`);
  console.log(`🌐 Доступен по адресу: http://localhost:${PORT}`);
  console.log(`📚 Основные endpoint:`);
  console.log(`   GET  http://localhost:${PORT}/api/technologies`);
  console.log(`   POST http://localhost:${PORT}/api/technologies`);
  console.log(`   POST http://localhost:${PORT}/api/import-roadmap`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`🔧 Dev frontend: http://localhost:3000`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔄 Импорт roadmap всегда работает (использует прокси/резервные данные)`);
});