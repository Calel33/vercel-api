// Schedule Manager - Server-side JSON operations
// Handles CRUD operations for schedules using file-based storage
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEDULES_FILE = path.join(process.cwd(), 'schedules-data.json');
const PRO_SALT = 'AgentHustle2024ProSalt!@#$%^&*()_+SecureKey';

/**
 * Hash a key using the same algorithm as the extension
 * @param {string} key - Plain text key
 * @param {string} salt - Salt for hashing
 * @returns {string} - Hashed key
 */
function hashKey(key, salt = PRO_SALT) {
    return crypto.createHash('sha256').update(key + salt).digest('hex');
}

/**
 * Load schedules data from JSON file
 * @returns {Object} - Schedules data
 */
function loadSchedulesData() {
    try {
        if (!fs.existsSync(SCHEDULES_FILE)) {
            const initialData = {
                schedules: {},
                executions: {},
                lastCleanup: null,
                version: "1.0.0"
            };
            fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        
        const data = fs.readFileSync(SCHEDULES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading schedules data:', error);
        return {
            schedules: {},
            executions: {},
            lastCleanup: null,
            version: "1.0.0"
        };
    }
}

/**
 * Save schedules data to JSON file
 * @param {Object} data - Schedules data to save
 */
function saveSchedulesData(data) {
    try {
        fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving schedules data:', error);
        return false;
    }
}

/**
 * Create a new schedule
 * @param {string} userKey - User's pro key (hashed)
 * @param {Object} scheduleData - Schedule configuration
 * @returns {Object} - Created schedule with ID
 */
function createSchedule(userKey, scheduleData) {
    const data = loadSchedulesData();
    const scheduleId = generateScheduleId();
    
    const schedule = {
        id: scheduleId,
        userKey: userKey,
        name: scheduleData.name,
        prompt: scheduleData.prompt,
        schedule: scheduleData.schedule, // cron expression or simple pattern
        enabled: scheduleData.enabled !== false,
        autoSend: scheduleData.autoSend || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastExecuted: null,
        nextExecution: calculateNextExecution(scheduleData.schedule),
        executionCount: 0,
        failureCount: 0
    };
    
    data.schedules[scheduleId] = schedule;
    
    if (saveSchedulesData(data)) {
        return { success: true, schedule };
    } else {
        return { success: false, error: 'Failed to save schedule' };
    }
}

/**
 * Get schedules for a user
 * @param {string} userKey - User's pro key (hashed)
 * @returns {Array} - User's schedules
 */
function getUserSchedules(userKey) {
    const data = loadSchedulesData();
    const userSchedules = Object.values(data.schedules)
        .filter(schedule => schedule.userKey === userKey)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return userSchedules;
}

/**
 * Update a schedule
 * @param {string} scheduleId - Schedule ID
 * @param {string} userKey - User's pro key (hashed)
 * @param {Object} updates - Updates to apply
 * @returns {Object} - Update result
 */
function updateSchedule(scheduleId, userKey, updates) {
    const data = loadSchedulesData();
    const schedule = data.schedules[scheduleId];
    
    if (!schedule) {
        return { success: false, error: 'Schedule not found' };
    }
    
    if (schedule.userKey !== userKey) {
        return { success: false, error: 'Unauthorized' };
    }
    
    // Update allowed fields
    const allowedFields = ['name', 'prompt', 'schedule', 'enabled', 'autoSend'];
    allowedFields.forEach(field => {
        if (updates.hasOwnProperty(field)) {
            schedule[field] = updates[field];
        }
    });
    
    // Recalculate next execution if schedule changed
    if (updates.schedule) {
        schedule.nextExecution = calculateNextExecution(updates.schedule);
    }
    
    schedule.updatedAt = new Date().toISOString();
    
    if (saveSchedulesData(data)) {
        return { success: true, schedule };
    } else {
        return { success: false, error: 'Failed to update schedule' };
    }
}

/**
 * Delete a schedule
 * @param {string} scheduleId - Schedule ID
 * @param {string} userKey - User's pro key (hashed)
 * @returns {Object} - Delete result
 */
function deleteSchedule(scheduleId, userKey) {
    const data = loadSchedulesData();
    const schedule = data.schedules[scheduleId];
    
    if (!schedule) {
        return { success: false, error: 'Schedule not found' };
    }
    
    if (schedule.userKey !== userKey) {
        return { success: false, error: 'Unauthorized' };
    }
    
    delete data.schedules[scheduleId];
    
    if (saveSchedulesData(data)) {
        return { success: true };
    } else {
        return { success: false, error: 'Failed to delete schedule' };
    }
}

/**
 * Get schedules due for execution
 * @returns {Array} - Schedules ready to execute
 */
function getDueSchedules() {
    const data = loadSchedulesData();
    const now = new Date();
    
    return Object.values(data.schedules)
        .filter(schedule => {
            if (!schedule.enabled) return false;
            if (!schedule.nextExecution) return false;
            
            const nextExec = new Date(schedule.nextExecution);
            return nextExec <= now;
        })
        .sort((a, b) => new Date(a.nextExecution) - new Date(b.nextExecution));
}

/**
 * Mark schedule as executed and update next execution time
 * @param {string} scheduleId - Schedule ID
 * @param {boolean} success - Whether execution was successful
 * @returns {boolean} - Update success
 */
function markScheduleExecuted(scheduleId, success = true) {
    const data = loadSchedulesData();
    const schedule = data.schedules[scheduleId];
    
    if (!schedule) return false;
    
    schedule.lastExecuted = new Date().toISOString();
    schedule.executionCount = (schedule.executionCount || 0) + 1;
    
    if (success) {
        schedule.failureCount = 0;
    } else {
        schedule.failureCount = (schedule.failureCount || 0) + 1;
        
        // Disable schedule after 5 consecutive failures
        if (schedule.failureCount >= 5) {
            schedule.enabled = false;
        }
    }
    
    // Calculate next execution time
    schedule.nextExecution = calculateNextExecution(schedule.schedule);
    schedule.updatedAt = new Date().toISOString();
    
    return saveSchedulesData(data);
}

/**
 * Generate unique schedule ID
 * @returns {string} - Unique schedule ID
 */
function generateScheduleId() {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate next execution time based on schedule pattern
 * @param {string} schedulePattern - Schedule pattern (daily, weekly, etc.)
 * @returns {string} - Next execution time ISO string
 */
function calculateNextExecution(schedulePattern) {
    const now = new Date();
    
    switch (schedulePattern) {
        case 'daily':
            return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        case 'weekly':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        case 'hourly':
            return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        default:
            // Default to daily if pattern not recognized
            return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
}

/**
 * Clean up old execution records (called periodically)
 * @param {number} daysToKeep - Days of execution history to keep
 */
function cleanupOldExecutions(daysToKeep = 30) {
    const data = loadSchedulesData();
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    // Remove old execution records
    Object.keys(data.executions).forEach(executionId => {
        const execution = data.executions[executionId];
        if (new Date(execution.createdAt) < cutoffDate) {
            delete data.executions[executionId];
        }
    });
    
    data.lastCleanup = new Date().toISOString();
    saveSchedulesData(data);
}

module.exports = {
    hashKey,
    loadSchedulesData,
    saveSchedulesData,
    createSchedule,
    getUserSchedules,
    updateSchedule,
    deleteSchedule,
    getDueSchedules,
    markScheduleExecuted,
    cleanupOldExecutions
};