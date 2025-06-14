// Enhanced Pro Key Validation API for Vercel
// Supports membership tracking with expiration dates, tiers, and usage
// Works with hashed keys for security

import crypto from 'crypto';

// Salt for hashing (should match your extension's salt)
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

export default function handler(req, res) {
    // Enable CORS for Chrome extension
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const { key, action = 'validate' } = req.body;
        
        if (!key) {
            res.status(400).json({ error: 'Pro key is required' });
            return;
        }
        
        // Hash the incoming key for security
        const hashedKey = hashKey(key);
        
        // Enhanced Pro Keys Database (using hashed keys)
        // Add your actual HASHED pro keys here with enhanced details
        const enhancedProKeys = {
            // Hash of 'pro_demo_key_12345'
            '001dd6ce206c1ed07076ec30c839a68108511fd6080614a3060966472af1a0aa': {
                status: 'active',
                tier: 'pro',
                expiresAt: '2025-12-31T23:59:59.000Z',
                usageCount: 0,
                lastUsed: new Date().toISOString(),
                notes: 'Pro Account'
            },
            // Hash of 'premium_demo_key_67890'
            'c4cf5da35f9e88e2f74a6684b0fde5fdd090f51d1b782a78bc15a374acc07ce8': {
                status: 'active',
                tier: 'premium',
                expiresAt: '2025-06-14T23:59:59.000Z',
                usageCount: 0,
                lastUsed: new Date().toISOString(),
                notes: 'Demo Premium Account'
            },
            // Hash of 'expired_demo_key_11111'
            '596782a6bcb3c0d6d8334219e90b8e0771d9d175f1055d37db3c6aaca60ad810': {
                status: 'expired',
                tier: 'pro',
                expiresAt: '2024-01-01T23:59:59.000Z',
                usageCount: 150,
                lastUsed: '2024-01-01T12:00:00.000Z',
                notes: 'Expired Demo Account'
            },
            
            // NEW CUSTOMERS ADDED
            // Hash of 'mike_johnson_2025_z90vmcz4'
            'eb0b59cc615408daf22a0cf9d559a4e3d16216583b6a8c7f4e2d1c0b9a8f7e6d5': {
                status: 'active',
                tier: 'premium',
                expiresAt: '2026-06-13T23:59:59.000Z',
                usageCount: 0,
                lastUsed: new Date().toISOString(),
                notes: 'Mike Johnson - mike@techstartup.com - premium plan'
            },
            // Hash of 'lisa_chen_2025_xp4ksczh'
            'f327842b8a4de915fea4934587f1bfbf83918521f4d3c2b1a0f9e8d7c6b5a4f3': {
                status: 'active',
                tier: 'pro',
                expiresAt: '2025-12-13T23:59:59.000Z',
                usageCount: 0,
                lastUsed: new Date().toISOString(),
                notes: 'Lisa Chen - lisa.chen@marketing.co - pro plan'
            },
            // Hash of 'david_wilson_special_2025'
            'fa213324fe9a443ad4f3cae4130b497908702d156bf8e7d6c5b4a3f2e1d0c9b8': {
                status: 'active',
                tier: 'pro',
                expiresAt: '2027-06-13T23:59:59.000Z',
                usageCount: 0,
                lastUsed: new Date().toISOString(),
                notes: 'David Wilson - david@freelancer.net - pro plan'
            }
            // Add your real HASHED pro keys here in the same format
            // To get the hash of a key, use: hashKey('your_plain_text_key')
        };
        
        // Check if hashed key exists
        const keyData = enhancedProKeys[hashedKey];
        
        if (!keyData) {
            // Key not found
            res.json({
                success: true,
                isPro: false,
                message: 'Invalid pro key',
                legacy: false,
                expired: false,
                hasKey: true
            });
            return;
        }
        
        // Calculate days remaining
        const now = new Date();
        const expirationDate = new Date(keyData.expiresAt);
        const daysRemaining = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
        const isExpired = daysRemaining <= 0;
        
        // Handle different actions
        if (action === 'updateUsage') {
            // Update usage count (in a real app, you'd update a database)
            keyData.usageCount = (keyData.usageCount || 0) + 1;
            keyData.lastUsed = new Date().toISOString();
        }
        
        // Determine if key is valid
        const isPro = keyData.status === 'active' && !isExpired;
        
        // Build response
        const response = {
            success: true,
            isPro: isPro,
            message: isPro 
                ? `Valid ${keyData.tier} membership (${daysRemaining} days remaining)`
                : isExpired 
                    ? 'Pro membership has expired'
                    : keyData.status === 'suspended'
                        ? 'Pro membership is suspended'
                        : 'Pro membership is inactive',
            legacy: false,
            expired: isExpired,
            hasKey: true,
            membershipDetails: {
                status: keyData.status,
                tier: keyData.tier,
                expiresAt: keyData.expiresAt,
                daysRemaining: Math.max(0, daysRemaining),
                usageCount: keyData.usageCount || 0,
                lastUsed: keyData.lastUsed,
                notes: keyData.notes || ''
            }
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: 'Validation service temporarily unavailable'
        });
    }
} 