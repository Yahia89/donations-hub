const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const dataPath = path.join(__dirname, 'recipients.json');

app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


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

    // Ensure a valid JSON response
    res.setHeader('Content-Type', 'application/json');
    res.json(recipients);
  });
});
