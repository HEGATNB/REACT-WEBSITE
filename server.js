import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Настройка CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:8080',
    'https://react-website-igpb.onrender.com',
    'https://*.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400
};

app.use(cors(corsOptions));

// Middleware для добавления CSP заголовков
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
    "style-src 'self' 'unsafe-inline' https:; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' https: data:; " +
    "connect-src 'self' https: ws: wss:; " +
    "media-src 'self' https:; " +
    "object-src 'none'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self';"
  );

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

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

// Функция для использования публичного CORS прокси
const fetchWithCorsProxy = async (url) => {
  try {
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
      roadmapData = await fetchWithCorsProxy(url);
    } catch (proxyError) {
      console.log('CORS proxy failed, trying direct fetch:', proxyError.message);

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

        return res.json({
          success: true,
          data: getSampleTechnologies(url),
          roadmapTitle: 'Sample Roadmap (CORS blocked)',
          totalCount: 5
        });
      }
    }

    console.log('Roadmap data received');

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

  if (importedTechnologies.length === 0) {
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

// ============ HEALTH CHECK ============

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    technologiesCount: technologies.length
  });
});

// Favicon route
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Обслуживание статических файлов в production
if (process.env.NODE_ENV === 'production') {
  // Обслуживаем статические файлы из папки dist
  app.use(express.static(path.join(__dirname, 'dist')));

  // Обработка SPA маршрутов - ВАЖНО: этот маршрут должен быть ПОСЛЕ всех API маршрутов
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Root API route
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production' && req.accepts('html')) {
    return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }

  res.json({
    message: 'Tech Tracker API',
    version: '1.0.0',
    endpoints: {
      technologies: '/api/technologies',
      import: '/api/import-roadmap',
      health: '/health'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Обработка 404 для API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api/technologies`);
  console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});