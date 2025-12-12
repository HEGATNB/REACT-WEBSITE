import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Простая CORS настройка для разработки
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
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

// SPA fallback - должен быть ПОСЛЕДНИМ
app.get('*', (req, res) => {
  // Если запрос к API, но маршрут не найден
  if (req.path.startsWith('/api/')) {
    console.log(`API route not found: ${req.path}`);
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  
  // Для React Router маршрутов - отдаем index.html
  console.log(`SPA route: ${req.path} -> index.html`);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Фронтенд доступен по адресу: http://localhost:${PORT}`);
  console.log(`📚 API доступно по адресу: http://localhost:${PORT}/api/technologies`);
  console.log(`🔧 Dev frontend: http://localhost:3000`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Logging enabled`);
});