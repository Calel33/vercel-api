// Cron Job Handler - Execute Scheduled Prompts
// Runs every 15 minutes to process due schedules
const { getDueSchedules, markScheduleExecuted } = require('../../lib/scheduleManager.js');
const { executePrompt } = require('../../lib/scheduleExecutor.js');

async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Verify this is a cron request (Vercel adds this header)
    const cronSecret = req.headers['authorization'];
    if (req.method === 'POST' && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow manual testing in development
        if (process.env.NODE_ENV !== 'development') {
            res.status(401).json({ error: 'Unauthorized cron request' });
            return;
        }
    }
    
    try {
        console.log('Starting scheduled execution check...');
        
        // Get schedules that are due for execution
        const dueSchedules = getDueSchedules();
        
        if (dueSchedules.length === 0) {
            console.log('No schedules due for execution');
            res.json({
                success: true,
                message: 'No schedules due for execution',
                processed: 0,
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        console.log(`Found ${dueSchedules.length} schedules due for execution`);
        
        const results = [];
        let successCount = 0;
        let failureCount = 0;
        
        // Process each due schedule
        for (const schedule of dueSchedules) {
            try {
                console.log(`Executing schedule: ${schedule.name} (${schedule.id})`);
                
                // Execute the prompt
                const executionResult = await executePrompt(schedule);
                
                if (executionResult.success) {
                    // Mark as successfully executed
                    markScheduleExecuted(schedule.id, true);
                    successCount++;
                    
                    results.push({
                        scheduleId: schedule.id,
                        scheduleName: schedule.name,
                        success: true,
                        executedAt: new Date().toISOString()
                    });
                    
                    console.log(`Successfully executed schedule: ${schedule.name}`);
                } else {
                    // Mark as failed execution
                    markScheduleExecuted(schedule.id, false);
                    failureCount++;
                    
                    results.push({
                        scheduleId: schedule.id,
                        scheduleName: schedule.name,
                        success: false,
                        error: executionResult.error,
                        executedAt: new Date().toISOString()
                    });
                    
                    console.error(`Failed to execute schedule: ${schedule.name}`, executionResult.error);
                }
                
                // Small delay between executions to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`Error processing schedule ${schedule.id}:`, error);
                
                // Mark as failed execution
                markScheduleExecuted(schedule.id, false);
                failureCount++;
                
                results.push({
                    scheduleId: schedule.id,
                    scheduleName: schedule.name,
                    success: false,
                    error: error.message,
                    executedAt: new Date().toISOString()
                });
            }
        }
        
        console.log(`Execution complete. Success: ${successCount}, Failures: ${failureCount}`);
        
        res.json({
            success: true,
            message: `Processed ${dueSchedules.length} schedules`,
            processed: dueSchedules.length,
            successCount,
            failureCount,
            results,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Cron execution error:', error);
        res.status(500).json({
            success: false,
            error: 'Cron execution failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = handler; 