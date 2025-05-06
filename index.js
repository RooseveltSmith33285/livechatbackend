require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Handle POST requests (LiveChat webhook)
app.post('/webhook/livechat', async (req, res) => {
  try {
 console.log("webhook working")
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing lead.' });
  }
});



app.listen(5000, () => {
  console.log('API server running on port 5000'); // Fixed typo (500 → 5000)
});