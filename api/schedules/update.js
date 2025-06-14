// Update Schedule API Endpoint
// Handles modification of existing scheduled prompts
const { hashKey, updateSchedule } = require('../../lib/scheduleManager.js');

/**
 * Validate schedule pattern (supports both basic and custom patterns)
 * @param {string|Object} schedule - Schedule pattern to validate
 * @returns {Object} - Validation result
 */
function validateSchedulePattern(schedule) {
    const basicPatterns = ['daily', 'weekly', 'hourly'];
    
    // Check if it's a basic pattern
    if (basicPatterns.includes(schedule)) {
        return { isValid: true };
    }
    
    // Check if it's a custom schedule object
    if (typeof schedule === 'object' && schedule !== null) {
        if (!schedule.type) {
            return { isValid: false, error: 'Custom schedule must have a type' };
        }
        
        switch (schedule.type) {
            case 'specific-times':
                if (!schedule.times || !Array.isArray(schedule.times) || schedule.times.length === 0) {
                    return { isValid: false, error: 'Specific times schedule must have at least one time' };
                }
                if (!schedule.days || !Array.isArray(schedule.days) || schedule.days.length === 0) {
                    return { isValid: false, error: 'Specific times schedule must have at least one day selected' };
                }
                return { isValid: true };
            case 'interval':
                if (!schedule.value || schedule.value < 1) {
                    return { isValid: false, error: 'Interval schedule must have a positive value' };
                }
                if (!schedule.unit || !['minutes', 'hours', 'days'].includes(schedule.unit)) {
                    return { isValid: false, error: 'Interval schedule must have a valid unit (minutes, hours, days)' };
                }
                return { isValid: true };
            case 'cron':
                if (!schedule.expression || typeof schedule.expression !== 'string') {
                    return { isValid: false, error: 'Cron schedule must have a valid expression' };
                }
                // Basic cron validation (5 or 6 parts)
                const cronParts = schedule.expression.trim().split(/\s+/);
                if (cronParts.length < 5 || cronParts.length > 6) {
                    return { isValid: false, error: 'Cron expression must have 5 or 6 parts' };
                }
                return { isValid: true };
            default:
                return { isValid: false, error: 'Invalid custom schedule type' };
        }
    }
    
    return { isValid: false, error: 'Invalid schedule pattern. Supported: daily, weekly, hourly, or custom object' };
}

// Pro Keys Database (reuse from validate-key.js pattern)
const enhancedProKeys = {
    // Hash of 'pro_demo_key_12345'
    '001dd6ce206c1ed07076ec30c839a68108511fd6080614a3060966472af1a0aa': {
        status: 'active',
        tier: 'pro',
        expiresAt: '2025-12-31T23:59:59.000Z'
    },
    // Hash of 'premium_demo_key_67890'
    'c4cf5da35f9e88e2f74a6684b0fde5fdd090f51d1b782a78bc15a374acc07ce8': {
        status: 'active',
        tier: 'premium',
        expiresAt: '2025-06-14T23:59:59.000Z'
    },
    // Hash of 'mike_johnson_2025_z90vmcz4'
    'eb0b59cc615408daf22a0cf9d559a4e3d16216583b6a8c7f4e2d1c0b9a8f7e6d5': {
        status: 'active',
        tier: 'premium',
        expiresAt: '2026-06-13T23:59:59.000Z'
    },
    // Hash of 'lisa_chen_2025_xp4ksczh'
    'f327842b8a4de915fea4934587f1bfbf83918521f4d3c2b1a0f9e8d7c6b5a4f3': {
        status: 'active',
        tier: 'pro',
        expiresAt: '2025-12-13T23:59:59.000Z'
    },
    // Hash of 'david_wilson_special_2025'
    'fa213324fe9a443ad4f3cae4130b497908702d156bf8e7d6c5b4a3f2e1d0c9b8': {
        status: 'active',
        tier: 'pro',
        expiresAt: '2027-06-13T23:59:59.000Z'
    }
};

function handler(req, res) {
    // Enable CORS for Chrome extension
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'PUT') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const { key, scheduleId, updates } = req.body;
        
        if (!key) {
            res.status(400).json({ error: 'Pro key is required' });
            return;
        }
        
        if (!scheduleId) {
            res.status(400).json({ error: 'Schedule ID is required' });
            return;
        }
        
        if (!updates || typeof updates !== 'object') {
            res.status(400).json({ error: 'Updates object is required' });
            return;
        }
        
        // Hash the incoming key for security
        const hashedKey = hashKey(key);
        
        // Check if key exists and is valid
        const keyData = enhancedProKeys[hashedKey];
        if (!keyData) {
            res.status(401).json({ error: 'Invalid pro key' });
            return;
        }
        
        // Check if key is active and not expired
        const now = new Date();
        const expirationDate = new Date(keyData.expiresAt);
        const isExpired = expirationDate <= now;
        
        if (keyData.status !== 'active' || isExpired) {
            res.status(401).json({ 
                error: 'Pro membership is not active or has expired' 
            });
            return;
        }
        
        // Validate schedule pattern if being updated
        if (updates.schedule) {
            const validationResult = validateSchedulePattern(updates.schedule);
            if (!validationResult.isValid) {
                res.status(400).json({ 
                    error: validationResult.error
                });
                return;
            }
        }
        
        // Sanitize updates (only allow certain fields)
        const allowedUpdates = {};
        const allowedFields = ['name', 'prompt', 'schedule', 'enabled', 'autoSend'];
        
        allowedFields.forEach(field => {
            if (updates.hasOwnProperty(field)) {
                if (field === 'name' && updates[field]) {
                    allowedUpdates[field] = updates[field].trim();
                } else if (field === 'prompt' && updates[field]) {
                    allowedUpdates[field] = updates[field].trim();
                } else {
                    allowedUpdates[field] = updates[field];
                }
            }
        });
        
        // Update the schedule
        const result = updateSchedule(scheduleId, hashedKey, allowedUpdates);
        
        if (result.success) {
            res.json({
                success: true,
                schedule: {
                    id: result.schedule.id,
                    name: result.schedule.name,
                    prompt: result.schedule.prompt,
                    schedule: result.schedule.schedule,
                    enabled: result.schedule.enabled,
                    updatedAt: result.schedule.updatedAt,
                    nextExecution: result.schedule.nextExecution,
                    autoSend: result.schedule.autoSend
                }
            });
        } else {
            const statusCode = result.error === 'Schedule not found' ? 404 :
                              result.error === 'Unauthorized' ? 403 : 500;
            
            res.status(statusCode).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        console.error('Schedule update error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error'
        });
    }
}

module.exports = handler; 