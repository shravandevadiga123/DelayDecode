import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import delayRoutes from './routes/delay.js';
import chatRoutes from './routes/chat.js';
import emailService from './services/emailService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'Server running' });
});

app.use('/api', delayRoutes);
app.use('/api/chat', chatRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
