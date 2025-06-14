// Schedule Executor - Handles prompt execution and auto-send
// Integrates with Agent Hustle API and existing auto-send modules
const { sendAnalysisToTelegram, sendAnalysisToDiscord } = require('./autoSendHandler.js');

const AGENT_HUSTLE_API_ENDPOINT = 'https://agenthustle.ai/api/analyze';

/**
 * Execute a scheduled prompt
 * @param {Object} schedule - Schedule object with prompt and settings
 * @returns {Promise<Object>} - Execution result
 */
async function executePrompt(schedule) {
    try {
        console.log(`Executing prompt for schedule: ${schedule.name}`);
        
        // Call Agent Hustle API to analyze the prompt
        const analysisResult = await callAgentHustleAPI(schedule.prompt);
        
        if (!analysisResult.success) {
            return {
                success: false,
                error: analysisResult.error || 'Analysis failed'
            };
        }
        
        // Prepare analysis data for auto-send
        const analysisData = {
            analysisType: `Scheduled: ${schedule.name}`,
            result: analysisResult.data,
            date: new Date(),
            scheduleId: schedule.id,
            scheduleName: schedule.name
        };
        
        // Handle auto-send if configured
        const autoSendResults = await handleAutoSend(schedule, analysisData);
        
        // Store execution result
        await storeExecutionResult(schedule.id, {
            success: true,
            analysisData,
            autoSendResults,
            executedAt: new Date().toISOString()
        });
        
        return {
            success: true,
            analysisData,
            autoSendResults
        };
        
    } catch (error) {
        console.error(`Error executing schedule ${schedule.id}:`, error);
        
        // Store failure result
        await storeExecutionResult(schedule.id, {
            success: false,
            error: error.message,
            executedAt: new Date().toISOString()
        });
        
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Call Agent Hustle API to analyze prompt
 * @param {string} prompt - The prompt to analyze
 * @returns {Promise<Object>} - API response
 */
async function callAgentHustleAPI(prompt) {
    try {
        const response = await fetch(AGENT_HUSTLE_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Agent-Hustle-Pro-Scheduler/1.0'
            },
            body: JSON.stringify({
                prompt: prompt,
                analysisType: 'scheduled_analysis',
                options: {
                    includeKeyPoints: true,
                    includeSummary: true,
                    maxLength: 4000
                }
            }),
            signal: AbortSignal.timeout(60000) // 60 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
            success: true,
            data: data
        };
        
    } catch (error) {
        console.error('Agent Hustle API call failed:', error);
        
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Handle auto-send functionality for executed schedules
 * @param {Object} schedule - Schedule configuration
 * @param {Object} analysisData - Analysis results
 * @returns {Promise<Object>} - Auto-send results
 */
async function handleAutoSend(schedule, analysisData) {
    const results = {
        telegram: null,
        discord: null
    };
    
    if (!schedule.autoSend) {
        return results;
    }
    
    // Handle Telegram auto-send
    if (schedule.autoSend.telegram && schedule.autoSend.telegram.enabled) {
        try {
            const telegramResult = await sendAnalysisToTelegram(
                analysisData,
                schedule.autoSend.telegram.botToken,
                schedule.autoSend.telegram.chatId
            );
            
            results.telegram = telegramResult;
            console.log(`Telegram auto-send result for ${schedule.name}:`, telegramResult.success);
            
        } catch (error) {
            console.error(`Telegram auto-send failed for ${schedule.name}:`, error);
            results.telegram = {
                success: false,
                error: error.message
            };
        }
    }
    
    // Handle Discord auto-send
    if (schedule.autoSend.discord && schedule.autoSend.discord.enabled) {
        try {
            const discordResult = await sendAnalysisToDiscord(
                analysisData,
                schedule.autoSend.discord.webhookUrl
            );
            
            results.discord = discordResult;
            console.log(`Discord auto-send result for ${schedule.name}:`, discordResult.success);
            
        } catch (error) {
            console.error(`Discord auto-send failed for ${schedule.name}:`, error);
            results.discord = {
                success: false,
                error: error.message
            };
        }
    }
    
    return results;
}

/**
 * Store execution result for history tracking
 * @param {string} scheduleId - Schedule ID
 * @param {Object} result - Execution result
 */
async function storeExecutionResult(scheduleId, result) {
    try {
        // Import here to avoid circular dependencies
        const { loadSchedulesData, saveSchedulesData } = require('./scheduleManager.js');
        
        const data = loadSchedulesData();
        
        // Create execution record
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        data.executions[executionId] = {
            id: executionId,
            scheduleId: scheduleId,
            ...result,
            createdAt: new Date().toISOString()
        };
        
        // Keep only last 100 executions per schedule to manage storage
        const scheduleExecutions = Object.values(data.executions)
            .filter(exec => exec.scheduleId === scheduleId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (scheduleExecutions.length > 100) {
            const toDelete = scheduleExecutions.slice(100);
            toDelete.forEach(exec => {
                delete data.executions[exec.id];
            });
        }
        
        saveSchedulesData(data);
        
    } catch (error) {
        console.error('Error storing execution result:', error);
    }
}

/**
 * Get execution history for a schedule
 * @param {string} scheduleId - Schedule ID
 * @param {number} limit - Number of executions to return
 * @returns {Array} - Execution history
 */
async function getExecutionHistory(scheduleId, limit = 10) {
    try {
        const { loadSchedulesData } = require('./scheduleManager.js');
        const data = loadSchedulesData();
        
        const executions = Object.values(data.executions)
            .filter(exec => exec.scheduleId === scheduleId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
        
        return executions;
        
    } catch (error) {
        console.error('Error getting execution history:', error);
        return [];
    }
}

module.exports = {
    executePrompt,
    getExecutionHistory
}; 