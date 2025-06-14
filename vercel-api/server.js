// Express Server for Render Deployment
// Handles all API routes for Agent Hustle Pro Scheduling
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Agent Hustle Pro Scheduling API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Import API handlers
const createScheduleHandler = require('./api/schedules/create.js');
const listSchedulesHandler = require('./api/schedules/list.js');
const updateScheduleHandler = require('./api/schedules/update.js');
const deleteScheduleHandler = require('./api/schedules/delete.js');
const executeSchedulesHandler = require('./api/cron/execute-schedules.js');

// Schedule management routes
app.post('/api/schedules/create', createScheduleHandler);
app.get('/api/schedules/list', listSchedulesHandler);
app.put('/api/schedules/update', updateScheduleHandler);
app.delete('/api/schedules/delete', deleteScheduleHandler);

// Cron execution route
app.post('/api/cron/execute-schedules', executeSchedulesHandler);
app.get('/api/cron/execute-schedules', executeSchedulesHandler); // Allow GET for manual testing

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Agent Hustle Pro Scheduling API running on port ${PORT}`);
    console.log(`📅 Cron endpoint: /api/cron/execute-schedules`);
    console.log(`📋 Schedule management: /api/schedules/*`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 