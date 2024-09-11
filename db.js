require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

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

insertYouTubeChannelId("UC_A7K2dXFsTMAciGmnNxy-Q")
  .then(() => pool.end());