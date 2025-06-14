// Easy Pro Key Addition Script
// Run with: node add-pro-key.js
// This script helps you add new pro keys with proper formatting

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const PRO_SALT = 'AgentHustle2024ProSalt!@#$%^&*()_+SecureKey';

function hashKey(key, salt = PRO_SALT) {
    return crypto.createHash('sha256').update(key + salt).digest('hex');
}

function generateUniqueKey(customerName) {
    const cleanName = customerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 8);
    return `${cleanName}_${year}_${random}`;
}

function calculateExpirationDate(months) {
    const now = new Date();
    const expiration = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000);
    return expiration.toISOString();
}

// Customer data - EDIT THIS SECTION TO ADD NEW CUSTOMERS
const newCustomers = [
    {
        name: 'Mike Johnson',
        email: 'mike@techstartup.com',
        tier: 'premium',       // 'pro' or 'premium'
        months: 12,            // Number of months
        customKey: null        // Leave null for auto-generation, or specify custom key
    },
    {
        name: 'Lisa Chen',
        email: 'lisa.chen@marketing.co',
        tier: 'pro',
        months: 6,
        customKey: null
    },
    {
        name: 'David Wilson',
        email: 'david@freelancer.net',
        tier: 'pro',
        months: 24,            // 2 year subscription
        customKey: 'david_wilson_special_2025'  // Custom key
    }
    // Add more customers here...
];

console.log('🔑 Pro Key Generator\n');
console.log('=' * 50);

const generatedKeys = [];

newCustomers.forEach((customer, index) => {
    console.log(`\n👤 Customer ${index + 1}: ${customer.name}`);
    
    // Generate or use custom key
    const plainKey = customer.customKey || generateUniqueKey(customer.name);
    const hashedKey = hashKey(plainKey);
    const expiresAt = calculateExpirationDate(customer.months);
    
    console.log(`📧 Email: ${customer.email}`);
    console.log(`🔑 Plain Key: ${plainKey}`);
    console.log(`🔐 Hashed Key: ${hashedKey}`);
    console.log(`📅 Expires: ${expiresAt}`);
    console.log(`🏷️  Tier: ${customer.tier}`);
    console.log(`⏰ Duration: ${customer.months} months`);
    
    generatedKeys.push({
        customer,
        plainKey,
        hashedKey,
        expiresAt
    });
});

console.log('\n\n📋 CODE TO ADD TO api/validate-key.js');
console.log('=' * 50);
console.log('\nAdd these entries to the enhancedProKeys object:\n');

generatedKeys.forEach(({ customer, plainKey, hashedKey, expiresAt }) => {
    console.log(`// ${customer.name} - ${customer.email}`);
    console.log(`'${hashedKey}': {`);
    console.log(`    status: 'active',`);
    console.log(`    tier: '${customer.tier}',`);
    console.log(`    expiresAt: '${expiresAt}',`);
    console.log(`    usageCount: 0,`);
    console.log(`    lastUsed: new Date().toISOString(),`);
    console.log(`    notes: '${customer.name} - ${customer.email} - ${customer.tier} plan'`);
    console.log(`},\n`);
});

console.log('\n📝 CUSTOMER KEY LIST (Save this securely!)');
console.log('=' * 50);

generatedKeys.forEach(({ customer, plainKey, expiresAt }) => {
    console.log(`Customer: ${customer.name}`);
    console.log(`Email: ${customer.email}`);
    console.log(`Key: ${plainKey}`);
    console.log(`Tier: ${customer.tier}`);
    console.log(`Expires: ${new Date(expiresAt).toLocaleDateString()}`);
    console.log('---');
});

console.log('\n🚀 NEXT STEPS:');
console.log('1. Copy the code above to api/validate-key.js');
console.log('2. Run: vercel deploy --prod');
console.log('3. Send the plain text keys to your customers');
console.log('4. Save the customer key list in a secure location');

// Optionally save to file
const outputFile = `customer-keys-${new Date().toISOString().split('T')[0]}.txt`;
let fileContent = 'CUSTOMER PRO KEYS - CONFIDENTIAL\n';
fileContent += '=' * 40 + '\n\n';

generatedKeys.forEach(({ customer, plainKey, expiresAt }) => {
    fileContent += `Customer: ${customer.name}\n`;
    fileContent += `Email: ${customer.email}\n`;
    fileContent += `Key: ${plainKey}\n`;
    fileContent += `Tier: ${customer.tier}\n`;
    fileContent += `Expires: ${new Date(expiresAt).toLocaleDateString()}\n`;
    fileContent += '---\n';
});

fs.writeFileSync(outputFile, fileContent);
console.log(`\n💾 Customer keys saved to: ${outputFile}`);
console.log('⚠️  Keep this file secure and delete after distributing keys!'); 