import crypto from 'crypto';

const PRO_SALT = 'AgentHustle2024ProSalt!@#$%^&*()_+SecureKey';

function hashKey(key, salt = PRO_SALT) {
    return crypto.createHash('sha256').update(key + salt).digest('hex');
}

function addMonths(months) {
    return new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
}

const customers = [
    { key: 'mike_johnson_2025_z90vmcz4', name: 'Mike Johnson', email: 'mike@techstartup.com', tier: 'premium', months: 12 },
    { key: 'lisa_chen_2025_xp4ksczh', name: 'Lisa Chen', email: 'lisa.chen@marketing.co', tier: 'pro', months: 6 },
    { key: 'david_wilson_special_2025', name: 'David Wilson', email: 'david@freelancer.net', tier: 'pro', months: 24 }
];

console.log('📋 CODE TO ADD TO api/validate-key.js:\n');

customers.forEach(c => {
    const hash = hashKey(c.key);
    const expires = addMonths(c.months);
    console.log(`// ${c.name} - ${c.email}`);
    console.log(`'${hash}': {`);
    console.log(`    status: 'active',`);
    console.log(`    tier: '${c.tier}',`);
    console.log(`    expiresAt: '${expires}',`);
    console.log(`    usageCount: 0,`);
    console.log(`    lastUsed: new Date().toISOString(),`);
    console.log(`    notes: '${c.name} - ${c.email} - ${c.tier} plan'`);
    console.log(`},`);
    console.log('');
}); 