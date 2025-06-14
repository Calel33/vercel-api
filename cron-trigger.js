// Cron Trigger Script for Render
// This script is called by the Render cron job to execute scheduled prompts
const fetch = require('node-fetch');

async function triggerScheduleExecution() {
    try {
        console.log('🔍 Environment Debug:');
        console.log('📊 API_BASE_URL:', process.env.API_BASE_URL);
        console.log('📊 CRON_SECRET:', process.env.CRON_SECRET ? '[SET]' : '[NOT SET]');
        console.log('📊 NODE_ENV:', process.env.NODE_ENV);
        
        // Fallback to Render web service URL if environment variable not set
        const apiUrl = process.env.API_BASE_URL || 'https://hustleplug-scheduling-api.onrender.com';
        const cronSecret = process.env.CRON_SECRET || 'development-secret';
        
        console.log(`🕐 Triggering schedule execution at ${new Date().toISOString()}`);
        console.log(`📡 API URL: ${apiUrl}/api/cron/execute-schedules`);
        
        const response = await fetch(`${apiUrl}/api/cron/execute-schedules`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cronSecret}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Render-Cron-Trigger/1.0'
            },
            timeout: 300000 // 5 minute timeout
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Schedule execution completed successfully');
            console.log(`📊 Results: ${data.successCount} success, ${data.failureCount} failures`);
            console.log(`📋 Processed: ${data.processed} schedules`);
            
            if (data.results && data.results.length > 0) {
                console.log('📝 Execution details:');
                data.results.forEach(result => {
                    const status = result.success ? '✅' : '❌';
                    console.log(`  ${status} ${result.scheduleName} (${result.scheduleId})`);
                    if (!result.success && result.error) {
                        console.log(`    Error: ${result.error}`);
                    }
                });
            }
            
            process.exit(0);
        } else {
            console.error('❌ Schedule execution failed');
            console.error(`HTTP ${response.status}: ${response.statusText}`);
            console.error('Response:', data);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('💥 Cron trigger failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Handle process signals gracefully
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully');
    process.exit(0);
});

// Run the trigger
triggerScheduleExecution(); 