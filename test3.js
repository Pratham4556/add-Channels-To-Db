require('dotenv').config();
const { google } = require('googleapis');
const { Pool } = require('pg');

// Load API keys from environment variable
const apiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',').filter(key => key.trim() !== '') : [];

if (apiKeys.length === 0) {
    console.error('No API keys found. Please check your .env file.');
    process.exit(1);
}

let currentKeyIndex = 0;
const maxRequestsPerKey = 1000;
let requestCount = 0;

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Function to extract username from URL
const usernameExtractor = (url) => {
    const match = url.match(/(?:https:\/\/www\.youtube\.com\/(?:@|c\/|u\/|channel\/|user\/))([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};

// Function to build YouTube service
function buildYouTubeService() {
    return google.youtube({
        version: 'v3',
        auth: apiKeys[currentKeyIndex]
    });
}

// Function to get channel ID from username
async function getChannelIdFromUsername(username) {
    while (true) {
        try {
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
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                console.error(`API Error: ${error.message}`);
                return { error: `API Error: ${error.message}` };
            }
        }
    }
}

// Function to insert YouTube channel ID into database
async function insertYouTubeChannelId(ytChannelId) {
    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO public.channel_details (yt_channel_id, createdby, modifiedby)
            VALUES ($1, 'system', 'system')
            ON CONFLICT (yt_channel_id) DO NOTHING
            RETURNING channel_id;
        `;
        const result = await client.query(query, [ytChannelId]);
        if (result.rows.length > 0) {
            console.log(`Inserted YouTube channel ID: ${ytChannelId}. Assigned channel_id: ${result.rows[0].channel_id}`);
        } else {
            console.log(`YouTube channel ID: ${ytChannelId} already exists in the database.`);
        }
    } catch (error) {
        console.error('Error inserting YouTube channel ID:', error);
    } finally {
        client.release();
    }
}

// Main function to process URLs
async function processUrl(url) {
    const username = usernameExtractor(url);
    if (username) {
        console.log(`Extracted username: ${username}`);
        const channelData = await getChannelIdFromUsername(username);
        if (channelData.yt_channel_id) {
            await insertYouTubeChannelId(channelData.yt_channel_id);
        } else {
            console.error(channelData.error);
        }
    } else {
        console.error(`Could not extract username from URL: ${url}`);
    }
}

// Example usage
async function main() {
    const urls = [
        "https://www.youtube.com/@SonyMusicIndia",
        "https://www.youtube.com/c/tseries",
        "https://www.youtube.com/u/tseries"
    ];

    for (const url of urls) {
        await processUrl(url);
    }

    await pool.end();
}

main().catch(console.error);