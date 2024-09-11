

try {
    require('dotenv').config();
} catch (error) {
    console.error('Error loading dotenv:', error.message);
    console.error('Make sure you have installed dotenv by running: npm install dotenv');
    process.exit(1);
}
const { google } = require('googleapis');

// Load API keys from environment variable
const apiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',').filter(key => key.trim() !== '') : [];

if (apiKeys.length === 0) {
    console.error('No API keys found. Please check your .env file.');
    process.exit(1);
}

let currentKeyIndex = 0;
const maxRequestsPerKey = 1000;
let requestCount = 0;

function buildYouTubeService() {
    return google.youtube({
        version: 'v3',
        auth: apiKeys[currentKeyIndex]
    });
}

async function getChannelIdFromUsername(username) {
    while (true) {
        try {
            // Proactive key rotation
            if (requestCount >= maxRequestsPerKey) {
                currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
                requestCount = 0;
                console.log(`Switched to new API key: ${apiKeys[currentKeyIndex]}`);
            }

            const youtubeService = buildYouTubeService();
            requestCount++;

            const response = await youtubeService.channels.list({
                part: 'id',
                forHandle: username,
                fields: 'items(id)'
            });

            if (response.data.items && response.data.items.length > 0) {
                return {
                    yt_channel_id: response.data.items[0].id
                };
            } else {
                return {
                    error: `No channel found for username: ${username}`
                };
            }
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.error.errors[0].reason === 'quotaExceeded') {
                console.warn(`Quota exceeded for key: ${apiKeys[currentKeyIndex]}. Trying next key...`);
                currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
                requestCount = 0;
                await new Promise(resolve => setTimeout(resolve, 1000)); // Avoid too rapid retries
            } else {
                console.error(`API Error: ${error.message}`);
                return { error: `API Error: ${error.message}` };
            }
        }
    }
}

// Example usage
async function main() {
    const username = "SaregamaMusic"; // Replace with the username (handle) you want to fetch
    try {
        const data = await getChannelIdFromUsername(username);
        console.log('Channel Data:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();