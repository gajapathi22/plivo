// app.js
const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const app = express();



app.use(express.json());






// MySQL Database connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost', // Default to 'localhost' if environment variable is not set
  port: process.env.MYSQL_PORT || 3306,        // Default to 3306 if not set
  user: process.env.MYSQL_USER || 'root',      // Default to 'root' if not set
  password: process.env.MYSQL_PASSWORD || '',  // Default to empty string if not set
  database: process.env.MYSQL_DATABASE || '',  // Default to empty string if not set
});

// Initialize the table
const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS messages (
      account_id VARCHAR(50),
      message_id VARCHAR(36) PRIMARY KEY,
      sender_number VARCHAR(15),
      receiver_number VARCHAR(15)
    );
  `;
  await pool.query(query);
};
createTable();

// Route to create a new message
app.post('/create', async (req, res) => {
  const { account_id, sender_number, receiver_number } = req.body;
  const message_id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO messages (account_id, message_id, sender_number, receiver_number) VALUES (?, ?, ?, ?)',
      [account_id, message_id, sender_number, receiver_number]
    );
    res.status(201).json({ message: 'Message created successfully', message_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating message' });
  }
});

// Route to get all messages by account_id
app.get('/get/messages/:account_id', async (req, res) => {
  const { account_id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM messages WHERE account_id = ?', [account_id]);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Route to search messages
app.get('/search', async (req, res) => {
  const { message_id, sender_number, receiver_number } = req.query;
  let query = 'SELECT * FROM messages WHERE ';
  let conditions = [];
  let values = [];

  if (message_id) {
    conditions.push('message_id IN (?)');
    values.push(message_id.split(','));
  }

  if (sender_number) {
    conditions.push('sender_number IN (?)');
    values.push(sender_number.split(','));
  }

  if (receiver_number) {
    conditions.push('receiver_number IN (?)');
    values.push(receiver_number.split(','));
  }

  query += conditions.join(' AND ');

  try {
    const [rows] = await pool.query(query, values);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error searching messages' });
  }
});

// Basic error handling
app.use((req, res, next) => {
  res.status(404).send('Route not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
