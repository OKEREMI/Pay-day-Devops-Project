import { Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import { Express, NextFunction, Request, Response } from 'express';

const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// HTTP latency histogram
const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request latency',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

// Middleware to track HTTP metrics
export const metricsMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const end = httpRequestDuration.startTimer();

    res.on('finish', () => {
        end({
            method: req.method,
            route: req.route?.path || req.path,
            status_code: res.statusCode,
        });
    });

    next();
};

export const setupMetrics = (app: Express) => {
    app.get('/metrics', async (req, res) => {
        try {
            res.set('Content-Type', register.contentType);
            res.end(await register.metrics());
        } catch (ex) {
            res.status(500).end(ex);
        }
    });

    console.log('Prometheus metrics initialized on /metrics');
};

export default register;
