#!/usr/bin/env node

// Standalone Cron Scheduler for Render
// This script runs as a Render Cron Job to execute scheduled prompts

const path = require('path');
const { getDueSchedules, markScheduleExecuted, loadSchedulesData } = require('./lib/scheduleManager.js');
const { executePrompt } = require('./lib/scheduleExecutor.js');

async function runScheduler() {
    try {
        console.log('🕐 Starting scheduled execution check...', new Date().toISOString());
        console.log('🌍 Current timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
        console.log('📁 Working directory:', process.cwd());
        console.log('📁 Script location:', __dirname);
        
        // Load and log all schedules for debugging
        const allData = loadSchedulesData();
        const allSchedules = Object.values(allData.schedules || {});
        console.log(`📊 Total schedules in database: ${allSchedules.length}`);
        
        if (allSchedules.length > 0) {
            console.log('📋 All schedules:');
            allSchedules.forEach(schedule => {
                console.log(`  - ${schedule.name} (${schedule.id})`);
                console.log(`    Enabled: ${schedule.enabled}`);
                console.log(`    Next execution: ${schedule.nextExecution}`);
                console.log(`    Schedule pattern:`, schedule.schedule);
                console.log(`    Current time: ${new Date().toISOString()}`);
                
                if (schedule.nextExecution) {
                    const nextExec = new Date(schedule.nextExecution);
                    const now = new Date();
                    const timeDiff = nextExec.getTime() - now.getTime();
                    console.log(`    Time until next execution: ${Math.round(timeDiff / 1000 / 60)} minutes`);
                }
                console.log('');
            });
        }
        
        // Get schedules that are due for execution
        const dueSchedules = getDueSchedules();
        console.log(`🎯 Schedules due for execution: ${dueSchedules.length}`);
        
        if (dueSchedules.length === 0) {
            console.log('✅ No schedules due for execution at this time');
            return;
        }
        
        console.log(`📋 Found ${dueSchedules.length} schedules due for execution`);
        
        let successCount = 0;
        let failureCount = 0;
        
        // Process each due schedule
        for (const schedule of dueSchedules) {
            try {
                console.log(`🚀 Executing schedule: ${schedule.name} (${schedule.id})`);
                
                // Execute the prompt
                const executionResult = await executePrompt(schedule);
                
                if (executionResult.success) {
                    // Mark as successfully executed
                    markScheduleExecuted(schedule.id, true);
                    successCount++;
                    console.log(`✅ Successfully executed schedule: ${schedule.name}`);
                } else {
                    // Mark as failed execution
                    markScheduleExecuted(schedule.id, false);
                    failureCount++;
                    console.error(`❌ Failed to execute schedule: ${schedule.name}`, executionResult.error);
                }
                
                // Small delay between executions to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`💥 Error processing schedule ${schedule.id}:`, error);
                
                // Mark as failed execution
                markScheduleExecuted(schedule.id, false);
                failureCount++;
            }
        }
        
        console.log(`🏁 Execution complete. Success: ${successCount}, Failures: ${failureCount}`);
        
        // Exit successfully
        process.exit(0);
        
    } catch (error) {
        console.error('💥 Cron execution error:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the scheduler
runScheduler(); 