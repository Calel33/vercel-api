// Existing Pro Key Management Script
// Run with: node manage-existing-keys.js
// This script helps you manage existing pro keys

import crypto from 'crypto';

const PRO_SALT = 'AgentHustle2024ProSalt!@#$%^&*()_+SecureKey';

function hashKey(key, salt = PRO_SALT) {
    return crypto.createHash('sha256').update(key + salt).digest('hex');
}

function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

// EXISTING KEYS TO MANAGE
// Add the plain text keys you want to update here
const keyUpdates = [
    {
        plainKey: 'pro_demo_key_12345',
        action: 'renew',           // 'renew', 'suspend', 'reactivate', 'upgrade', 'downgrade'
        months: 12,                // For renewals - how many months to add
        newTier: null,             // For upgrades/downgrades - 'pro' or 'premium'
        reason: 'Customer renewed for 1 year'
    },
    {
        plainKey: 'expired_demo_key_11111',
        action: 'reactivate',
        months: 6,
        newTier: 'premium',        // Upgrade to premium
        reason: 'Customer reactivated with premium upgrade'
    }
    // Add more key updates here...
];

console.log('🔧 Pro Key Management Tool\n');
console.log('=' * 50);

const updates = [];

keyUpdates.forEach((update, index) => {
    console.log(`\n🔑 Key ${index + 1}: ${update.plainKey}`);
    console.log(`🎯 Action: ${update.action}`);
    
    const hashedKey = hashKey(update.plainKey);
    console.log(`🔐 Hash: ${hashedKey}`);
    
    let newConfig = {};
    
    switch (update.action) {
        case 'renew':
            const currentExpiry = new Date(); // Assume current date for demo
            const newExpiry = addMonths(currentExpiry, update.months);
            newConfig = {
                status: 'active',
                expiresAt: newExpiry.toISOString(),
                usageCount: 0, // Reset usage count on renewal
                lastUsed: new Date().toISOString(),
                notes: `Renewed for ${update.months} months - ${update.reason}`
            };
            console.log(`📅 New Expiry: ${newExpiry.toLocaleDateString()}`);
            break;
            
        case 'suspend':
            newConfig = {
                status: 'suspended',
                notes: `Suspended - ${update.reason}`
            };
            console.log(`⏸️  Status: Suspended`);
            break;
            
        case 'reactivate':
            const reactivateExpiry = addMonths(new Date(), update.months || 12);
            newConfig = {
                status: 'active',
                tier: update.newTier || 'pro',
                expiresAt: reactivateExpiry.toISOString(),
                usageCount: 0,
                lastUsed: new Date().toISOString(),
                notes: `Reactivated - ${update.reason}`
            };
            console.log(`✅ Status: Active`);
            console.log(`📅 New Expiry: ${reactivateExpiry.toLocaleDateString()}`);
            if (update.newTier) {
                console.log(`⬆️  Tier: ${update.newTier}`);
            }
            break;
            
        case 'upgrade':
            newConfig = {
                tier: 'premium',
                notes: `Upgraded to premium - ${update.reason}`
            };
            console.log(`⬆️  Tier: premium`);
            break;
            
        case 'downgrade':
            newConfig = {
                tier: 'pro',
                notes: `Downgraded to pro - ${update.reason}`
            };
            console.log(`⬇️  Tier: pro`);
            break;
    }
    
    updates.push({
        plainKey: update.plainKey,
        hashedKey,
        action: update.action,
        newConfig,
        reason: update.reason
    });
    
    console.log(`📝 Reason: ${update.reason}`);
});

console.log('\n\n📋 CONFIGURATION UPDATES');
console.log('=' * 50);
console.log('\nUpdate these entries in api/validate-key.js:\n');

updates.forEach(({ plainKey, hashedKey, action, newConfig, reason }) => {
    console.log(`// ${plainKey} - ${action}`);
    console.log(`'${hashedKey}': {`);
    
    // Show which fields to update
    if (newConfig.status) {
        console.log(`    status: '${newConfig.status}',`);
    }
    if (newConfig.tier) {
        console.log(`    tier: '${newConfig.tier}',`);
    }
    if (newConfig.expiresAt) {
        console.log(`    expiresAt: '${newConfig.expiresAt}',`);
    }
    if (newConfig.usageCount !== undefined) {
        console.log(`    usageCount: ${newConfig.usageCount},`);
    }
    if (newConfig.lastUsed) {
        console.log(`    lastUsed: '${newConfig.lastUsed}',`);
    }
    if (newConfig.notes) {
        console.log(`    notes: '${newConfig.notes}'`);
    }
    
    console.log(`},\n`);
});

console.log('\n📊 SUMMARY OF CHANGES');
console.log('=' * 50);

const actionCounts = {};
updates.forEach(({ action }) => {
    actionCounts[action] = (actionCounts[action] || 0) + 1;
});

Object.entries(actionCounts).forEach(([action, count]) => {
    console.log(`${action}: ${count} key(s)`);
});

console.log('\n🚀 NEXT STEPS:');
console.log('1. Review the configuration updates above');
console.log('2. Update the corresponding entries in api/validate-key.js');
console.log('3. Run: vercel deploy --prod');
console.log('4. Test the updated keys');
console.log('5. Notify customers of any changes if needed');

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('- Always backup your current api/validate-key.js before making changes');
console.log('- Test changes with the demo keys first');
console.log('- Keep records of all key management actions');
console.log('- Notify customers before suspending or changing their keys'); 