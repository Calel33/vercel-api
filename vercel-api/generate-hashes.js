// Helper script to generate hashed keys for the Vercel API
// Run with: node generate-hashes.js

import crypto from 'crypto';

// Salt for hashing (must match your extension's salt)
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

// Example keys to hash - replace with your actual pro keys
const plainTextKeys = [
    'pro_demo_key_12345',
    'premium_demo_key_67890',
    'expired_demo_key_11111',
    // Add your actual pro keys here
    // 'your_actual_pro_key_1',
    // 'your_actual_pro_key_2',
];

console.log('🔐 Generating Hashed Keys for Vercel API\n');
console.log('Copy these hashed keys to your api/validate-key.js file:\n');

plainTextKeys.forEach(key => {
    const hashedKey = hashKey(key);
    console.log(`// Hash of '${key}'`);
    console.log(`'${hashedKey}': {`);
    console.log(`    status: 'active',`);
    console.log(`    tier: 'pro',`);
    console.log(`    expiresAt: '2025-12-31T23:59:59.000Z',`);
    console.log(`    usageCount: 0,`);
    console.log(`    lastUsed: new Date().toISOString(),`);
    console.log(`    notes: 'Customer Name or ID'`);
    console.log(`},\n`);
});

console.log('📝 Instructions:');
console.log('1. Replace the example hashed keys in api/validate-key.js');
console.log('2. Add your actual plain text keys to this script');
console.log('3. Run this script again to generate new hashes');
console.log('4. Update the membership details (expiration, tier, notes)');
console.log('5. Deploy to Vercel');

// Test function to verify hashing works correctly
console.log('\n🧪 Testing hash function:');
const testKey = 'test_key_123';
const testHash = hashKey(testKey);
console.log(`Plain text: ${testKey}`);
console.log(`Hashed:     ${testHash}`);
console.log(`Length:     ${testHash.length} characters`); 