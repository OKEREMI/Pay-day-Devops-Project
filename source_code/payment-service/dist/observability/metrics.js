"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMetrics = exports.metricsMiddleware = void 0;
const prom_client_1 = require("prom-client");
const register = new prom_client_1.Registry();
// Add default metrics (CPU, memory, etc.)
(0, prom_client_1.collectDefaultMetrics)({ register });
// HTTP latency histogram
const httpRequestDuration = new prom_client_1.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request latency',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});
// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
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
exports.metricsMiddleware = metricsMiddleware;
const setupMetrics = (app) => {
    app.get('/metrics', async (req, res) => {
        try {
            res.set('Content-Type', register.contentType);
            res.end(await register.metrics());
        }
        catch (ex) {
            res.status(500).end(ex);
        }
    });
    console.log('Prometheus metrics initialized on /metrics');
};
exports.setupMetrics = setupMetrics;
exports.default = register;
