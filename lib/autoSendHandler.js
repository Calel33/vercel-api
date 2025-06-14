// Server-side Auto-Send Handler
// Reuses existing Telegram/Discord integration patterns for scheduled execution

/**
 * Send analysis results to Telegram (server-side version)
 * @param {Object} analysisData - The analysis data to send
 * @param {string} botToken - Telegram bot token
 * @param {string} chatId - Telegram chat ID
 * @returns {Promise<Object>} - Result of the send operation
 */
async function sendAnalysisToTelegram(analysisData, botToken, chatId) {
    try {
        if (!botToken || !chatId) {
            throw new Error('Bot token and chat ID are required');
        }

        const message = formatAnalysisAsMarkdown(analysisData);
        
        // Split message if too long
        const messages = splitLongMessage(message);
        
        const results = [];
        for (const msg of messages) {
            const result = await sendTelegramMessage(botToken, chatId, msg);
            results.push(result);
            
            // Small delay between messages to avoid rate limiting
            if (messages.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        return {
            success: true,
            messageCount: results.length,
            results: results
        };
        
    } catch (error) {
        console.error('Error sending to Telegram:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send analysis results to Discord (server-side version)
 * @param {Object} analysisData - The analysis data to send
 * @param {string} webhookUrl - Discord webhook URL
 * @returns {Promise<Object>} - Result of the send operation
 */
async function sendAnalysisToDiscord(analysisData, webhookUrl) {
    try {
        if (!webhookUrl) {
            throw new Error('Webhook URL is required');
        }

        const embed = formatAnalysisAsDiscordEmbed(analysisData);
        
        const payload = {
            embeds: [embed],
            username: 'Agent Hustle Pro Scheduler'
        };
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        
        if (!response.ok) {
            throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
        }
        
        return {
            success: true,
            messageId: response.headers.get('x-ratelimit-remaining') || 'unknown'
        };
        
    } catch (error) {
        console.error('Error sending to Discord:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send a message to Telegram using Bot API
 * @param {string} botToken - Bot token
 * @param {string} chatId - Chat ID
 * @param {string} message - Message text
 * @returns {Promise<Object>} - API response
 */
async function sendTelegramMessage(botToken, chatId, message) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.description || `HTTP ${response.status}`);
    }
    
    return {
        success: true,
        messageId: data.result.message_id
    };
}

/**
 * Format analysis data as Markdown for Telegram
 * @param {Object} analysisData - Analysis data object
 * @returns {string} - Formatted Markdown message
 */
function formatAnalysisAsMarkdown(analysisData) {
    const { analysisType, result, date, scheduleName } = analysisData;
    
    let message = `🤖 *Agent Hustle Scheduled Analysis*\n\n`;
    
    // Add schedule info
    message += `📋 *Schedule:* ${scheduleName || 'Unnamed Schedule'}\n`;
    message += `📊 *Type:* ${analysisType || 'Scheduled Analysis'}\n`;
    message += `📅 *Executed:* ${formatDate(date || new Date())}\n`;
    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Handle different result formats
    let content = '';
    let summary = '';
    let keyPoints = [];
    
    if (typeof result === 'object' && result !== null) {
        content = result.content || result.analysis || '';
        summary = result.summary || '';
        keyPoints = result.keyPoints || [];
    } else if (typeof result === 'string') {
        content = result;
    }
    
    // Add executive summary if available
    if (summary && summary.trim()) {
        message += `📋 *Executive Summary*\n`;
        message += `${cleanMarkdownForTelegram(summary.trim())}\n\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }
    
    // Add main analysis content
    if (content && content.trim()) {
        message += `📝 *Analysis Results*\n`;
        
        // Clean and format the content
        const cleanContent = cleanAnalysisContent(content);
        message += `${cleanMarkdownForTelegram(cleanContent)}\n\n`;
        
        if (keyPoints.length > 0 || summary) {
            message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
    }
    
    // Add key points if available
    if (keyPoints && Array.isArray(keyPoints) && keyPoints.length > 0) {
        message += `🔑 *Key Insights*\n`;
        keyPoints.forEach((point, index) => {
            const cleanPoint = point.trim();
            if (cleanPoint) {
                message += `${index + 1}. ${cleanMarkdownForTelegram(cleanPoint)}\n`;
            }
        });
        message += '\n';
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }
    
    // Add footer with branding
    message += `🚀 *Powered by Agent Hustle Pro Scheduler*\n`;
    message += `_Automated AI Analysis Delivered on Schedule_`;
    
    return message;
}

/**
 * Format analysis data as Discord embed
 * @param {Object} analysisData - Analysis data object
 * @returns {Object} - Discord embed object
 */
function formatAnalysisAsDiscordEmbed(analysisData) {
    const { analysisType, result, date, scheduleName } = analysisData;
    
    let content = '';
    let summary = '';
    
    if (typeof result === 'object' && result !== null) {
        content = result.content || result.analysis || '';
        summary = result.summary || '';
    } else if (typeof result === 'string') {
        content = result;
    }
    
    // Truncate content for Discord's 4096 character limit
    const maxLength = 3500; // Leave room for other fields
    if (content.length > maxLength) {
        content = content.substring(0, maxLength) + '...\n\n*[Content truncated - full analysis available in extension]*';
    }
    
    const embed = {
        title: '🤖 Agent Hustle Scheduled Analysis',
        description: content || 'No analysis content available',
        color: 0x00ff88, // Green color
        fields: [
            {
                name: '📋 Schedule',
                value: scheduleName || 'Unnamed Schedule',
                inline: true
            },
            {
                name: '📊 Type',
                value: analysisType || 'Scheduled Analysis',
                inline: true
            },
            {
                name: '📅 Executed',
                value: formatDate(date || new Date()),
                inline: true
            }
        ],
        footer: {
            text: 'Powered by Agent Hustle Pro Scheduler',
            icon_url: 'https://agenthustle.ai/favicon.ico'
        },
        timestamp: (date || new Date()).toISOString()
    };
    
    // Add summary as a field if available
    if (summary && summary.trim()) {
        embed.fields.push({
            name: '📋 Executive Summary',
            value: summary.length > 1024 ? summary.substring(0, 1021) + '...' : summary,
            inline: false
        });
    }
    
    return embed;
}

/**
 * Clean and format analysis content for better readability
 * @param {string} content - Raw analysis content
 * @returns {string} - Cleaned content
 */
function cleanAnalysisContent(content) {
    if (!content || typeof content !== 'string') {
        return '';
    }
    
    let cleaned = content.trim();
    
    // Remove excessive whitespace and normalize line breaks
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    
    // Use more of Telegram's 4096 character limit
    if (cleaned.length > 3500) {
        cleaned = cleaned.substring(0, 3500) + '...\n\n_[Content truncated for messaging]_';
    }
    
    return cleaned.trim();
}

/**
 * Clean markdown text for Telegram compatibility
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
function cleanMarkdownForTelegram(text) {
    if (!text) return '';
    
    // Escape problematic characters for Telegram Markdown
    return text
        .replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1')
        .replace(/\\\*/g, '*') // Allow bold
        .replace(/\\_/g, '_'); // Allow italic
}

/**
 * Split long messages for Telegram's character limit
 * @param {string} message - Message to split
 * @returns {Array} - Array of message parts
 */
function splitLongMessage(message) {
    const maxLength = 4096;
    
    if (message.length <= maxLength) {
        return [message];
    }
    
    const messages = [];
    let currentMessage = '';
    const lines = message.split('\n');
    
    for (const line of lines) {
        if ((currentMessage + line + '\n').length > maxLength) {
            if (currentMessage) {
                messages.push(currentMessage.trim());
                currentMessage = '';
            }
            
            // If single line is too long, split it
            if (line.length > maxLength) {
                const chunks = line.match(new RegExp(`.{1,${maxLength - 10}}`, 'g')) || [];
                chunks.forEach((chunk, index) => {
                    if (index === chunks.length - 1) {
                        currentMessage = chunk + '\n';
                    } else {
                        messages.push(chunk + '...');
                    }
                });
            } else {
                currentMessage = line + '\n';
            }
        } else {
            currentMessage += line + '\n';
        }
    }
    
    if (currentMessage.trim()) {
        messages.push(currentMessage.trim());
    }
    
    return messages;
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

module.exports = {
    sendAnalysisToTelegram,
    sendAnalysisToDiscord
};