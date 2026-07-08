import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';

const app = express();

// Security headers
app.use(helmet());

// CORS — allow frontend dev server
app.use(cors({
	origin: process.env.CORS_ORIGIN || [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
  credentials: true
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use('/api', routes);

app.use((err, req, res, next) => {
  try {
    import('fs').then(fs => {
      fs.writeFileSync('./error.log', `[${req.method} ${req.url}] Error: ${err.stack || String(err)}`);
    });
  } catch (e) {}

	const statusCode = err.statusCode || 500;
	const response = {
		success: false,
		code: err.code || 'INTERNAL_ERROR',
		message: err.message || 'Something went wrong'
	};

	if (process.env.NODE_ENV === 'development') {
		response.stack = err.stack;
	}

	return res.status(statusCode).json(response);
});

export default app;