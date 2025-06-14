#!/usr/bin/env node

// Test script to check schedule data loading
const { loadSchedulesData } = require('./lib/scheduleManager.js');

console.log('🧪 Testing schedule data loading...');
console.log('📁 Current working directory:', process.cwd());
console.log('📁 Script directory:', __dirname);

try {
    const data = loadSchedulesData();
    console.log('✅ Successfully loaded schedule data');
    console.log('📊 Schedule count:', Object.keys(data.schedules || {}).length);
    console.log('📊 Execution count:', Object.keys(data.executions || {}).length);
    
    if (Object.keys(data.schedules || {}).length > 0) {
        console.log('📋 Found schedules:');
        Object.values(data.schedules).forEach(schedule => {
            console.log(`  - ${schedule.name} (${schedule.id})`);
            console.log(`    Enabled: ${schedule.enabled}`);
            console.log(`    Next execution: ${schedule.nextExecution}`);
            console.log(`    Prompt: ${schedule.prompt}`);
        });
    } else {
        console.log('📭 No schedules found in database');
    }
} catch (error) {
    console.error('❌ Error loading schedule data:', error);
} 