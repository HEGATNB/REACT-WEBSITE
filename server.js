import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS настройка
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Логгирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

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
  },
  {
    id: 3,
    title: 'TypeScript',
    description: 'Типизированное надмножество JavaScript',
    status: 'not-started',
    category: 'language',
    difficulty: 'intermediate',
    notes: '',
    resources: ['https://www.typescriptlang.org'],
    createdAt: new Date().toISOString()
  }
];

// API Routes
app.get('/api/technologies', (req, res) => {
  console.log('GET /api/technologies - returning', technologies.length, 'items');
  res.json({
    success: true,
    data: technologies
  });
});

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

  console.log(`GET /api/technologies/${id} - found:`, tech.title);
  res.json({
    success: true,
    data: [tech]
  });
});

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

app.put('/api/technologies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = technologies.findIndex(t => t.id === id);

  if (index === -1) {
    console.log(`PUT /api/technologies/${id} - not found`);
    return res.status(404).json({
      success: false,
      message: 'Технология не найдена'
    });
  }

  console.log(`PUT /api/technologies/${id} - updating:`, req.body);
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

app.delete('/api/technologies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = technologies.findIndex(t => t.id === id);

  if (index === -1) {
    console.log(`DELETE /api/technologies/${id} - not found`);
    return res.status(404).json({
      success: false,
      message: 'Технология не найдена'
    });
  }

  console.log(`DELETE /api/technologies/${id} - deleting:`, technologies[index].title);
  technologies.splice(index, 1);

  res.json({
    success: true,
    message: 'Технология удалена'
  });
});

app.post('/api/technologies/sync', (req, res) => {
  const { technologies: incomingTechs } = req.body;

  if (incomingTechs && Array.isArray(incomingTechs)) {
    console.log('POST /api/technologies/sync - syncing', incomingTechs.length, 'technologies');
    technologies = incomingTechs;
  }

  res.json({
    success: true,
    data: technologies
  });
});

// Новый endpoint для импорта roadmap через сервер (обходит CORS)
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

    // Делаем запрос к roadmap.sh через сервер (обходит CORS)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TechTracker/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const roadmapData = await response.json();

    console.log('Roadmap data received, nodes count:', roadmapData.nodes?.length || 0);

    // Преобразуем данные roadmap в формат технологий
    const importedTechnologies = [];

    if (roadmapData.nodes && Array.isArray(roadmapData.nodes)) {
      roadmapData.nodes.forEach((node, index) => {
        if (node.label && node.label.trim()) {
          importedTechnologies.push({
            id: Date.now() + index,
            title: node.label.trim(),
            description: node.metadata?.description ||
                       `Технология из дорожной карты: ${roadmapData.title?.card || roadmapData.title?.page || 'Unknown'}`,
            status: 'not-started',
            category: roadmapData.title?.card?.toLowerCase().replace(/\s+/g, '-') || 'imported',
            difficulty: 'beginner',
            notes: '',
            resources: [],
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    console.log('Successfully converted', importedTechnologies.length, 'technologies from roadmap');

    res.json({
      success: true,
      data: importedTechnologies,
      roadmapTitle: roadmapData.title?.card || roadmapData.title?.page || 'Roadmap',
      totalCount: importedTechnologies.length
    });

  } catch (error) {
    console.error('Roadmap import error:', error);
    res.status(500).json({
      success: false,
      message: `Ошибка импорта: ${error.message}`,
      data: []
    });
  }
});

app.get('/health', (req, res) => {
  console.log('GET /health - OK');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    technologiesCount: technologies.length
  });
});

app.all('*', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).send();
  }
  next();
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    console.log(`API route not found: ${req.path}`);
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }

  console.log(`SPA route: ${req.path} -> index.html`);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Фронтенд доступен по адресу: http://localhost:${PORT}`);
  console.log(`📚 API доступно по адресу: http://localhost:${PORT}/api/technologies`);
  console.log(`🔄 Импорт roadmap: http://localhost:${PORT}/api/import-roadmap`);
  console.log(`🔧 Dev frontend: http://localhost:3000`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Logging enabled`);
});