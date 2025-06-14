// List Schedules API Endpoint
// Retrieves all schedules for a pro user
const { hashKey, getUserSchedules } = require('../../lib/scheduleManager.js');

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const { key } = req.query;
        
        if (!key) {
            res.status(400).json({ error: 'Pro key is required' });
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
        
        // Get user's schedules
        const schedules = getUserSchedules(hashedKey);
        
        // Return sanitized schedule data (don't expose sensitive info)
        const sanitizedSchedules = schedules.map(schedule => ({
            id: schedule.id,
            name: schedule.name,
            prompt: schedule.prompt,
            schedule: schedule.schedule,
            enabled: schedule.enabled,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
            lastExecuted: schedule.lastExecuted,
            nextExecution: schedule.nextExecution,
            executionCount: schedule.executionCount,
            failureCount: schedule.failureCount,
            autoSend: schedule.autoSend
        }));
        
        res.json({
            success: true,
            schedules: sanitizedSchedules,
            tier: keyData.tier,
            limits: {
                maxSchedules: keyData.tier === 'premium' ? 15 : 5,
                currentCount: sanitizedSchedules.length
            }
        });
        
    } catch (error) {
        console.error('Schedule listing error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error'
        });
    }
}

module.exports = handler; 