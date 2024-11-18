const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001; // Use process.env.PORT for deployments
const dataPath = path.join(__dirname, 'backend', 'recipients.json'); // Ensure path is correct

// CORS configuration (only allowing your GitHub Pages domain)
app.use(cors({
  origin: ['http://localhost:3000', 'https://yahia89.github.io'], // Add both localhost and production domains
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json());

// Endpoint to get recipients data
app.get('/recipients', (req, res) => {
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read data' });
    }
    res.json(JSON.parse(data));
  });
});

// Endpoint to add a new recipient
app.post('/recipients', (req, res) => {
  const newRecipient = req.body;

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read data' });
    }

    const recipients = JSON.parse(data);
    recipients.push(newRecipient);

    fs.writeFile(dataPath, JSON.stringify(recipients, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to write data' });
      }
      res.status(201).json({ message: 'Recipient added successfully' });
    });
  });
});

// Search recipients endpoint
app.get('/search-recipients', (req, res) => {
  const { name } = req.query;
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read data' });
    }

    let recipients = JSON.parse(data);

    if (name) {
      recipients = recipients.filter(recipient =>
        recipient.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    res.setHeader('Content-Type', 'application/json');
    res.json(recipients);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
