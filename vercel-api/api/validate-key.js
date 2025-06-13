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
            // Example hashed keys - replace with your actual hashed keys
            // Hash of 'pro_demo_key_12345'
            '8f7b3c9d2e1a5f6b4c8d9e2a1f5b6c8d9e2a1f5b6c8d9e2a1f5b6c8d9e2a1f5b': {
                status: 'active',
                tier: 'pro',
                expiresAt: '2025-12-31T23:59:59.000Z',
                usageCount: 0,
                lastUsed: new Date().toISOString(),
                notes: 'Demo Pro Account'
            },
            // Hash of 'premium_demo_key_67890'
            '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b': {
                status: 'active',
                tier: 'premium',
                expiresAt: '2026-06-30T23:59:59.000Z',
                usageCount: 0,
                lastUsed: new Date().toISOString(),
                notes: 'Demo Premium Account'
            },
            // Hash of 'expired_demo_key_11111'
            '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e': {
                status: 'expired',
                tier: 'pro',
                expiresAt: '2024-01-01T23:59:59.000Z',
                usageCount: 150,
                lastUsed: '2024-01-01T12:00:00.000Z',
                notes: 'Expired Demo Account'
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