import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    const allowedOrigins = [
      'https://react-website-igpb.onrender.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

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
  res.json({
    success: true,
    data: technologies
  });
});

app.get('/api/technologies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const tech = technologies.find(t => t.id === id);

  if (!tech) {
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

app.post('/api/technologies', (req, res) => {
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

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    technologiesCount: technologies.length
  });
});

// Обработка OPTIONS запросов для CORS
app.options('*', cors(corsOptions));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Фронтенд доступен по адресу: http://localhost:${PORT}`);
  console.log(`📚 API доступно по адресу: http://localhost:${PORT}/api/technologies`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});
