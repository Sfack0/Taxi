import { CorsOptions } from 'cors';
import config from './environment';

const corsOptions: CorsOptions = {
  origin: true, // Allow all origins — auth is handled via JWT tokens
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default corsOptions;
