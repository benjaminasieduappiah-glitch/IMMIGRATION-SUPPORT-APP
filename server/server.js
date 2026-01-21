const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('client/public'));

// Serve the main app on root
app.get('/', (req, res) => {
  res.sendFile('app.html', { root: 'client/public' });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, phone } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (email, password, full_name, phone) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, full_name, phone],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }

        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: { id: this.lastID, email, full_name }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, email: user.email, full_name: user.full_name }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Get all visa categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM visa_categories', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    res.json(rows);
  });
});

// Get service options for a category
app.get('/api/categories/:categoryId/options', (req, res) => {
  const { categoryId } = req.params;

  db.all(
    'SELECT * FROM service_options WHERE category_id = ?',
    [categoryId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch service options' });
      }
      res.json(rows);
    }
  );
});

// Get all service options with category info
app.get('/api/service-options', (req, res) => {
  const query = `
    SELECT so.*, vc.name as category_name, vc.category_type 
    FROM service_options so
    JOIN visa_categories vc ON so.category_id = vc.id
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch service options' });
    }
    res.json(rows);
  });
});

// Update service option pricing (admin function)
app.put('/api/service-options/:optionId', authenticateToken, (req, res) => {
  const { optionId } = req.params;
  const { base_price, option_name, description, processing_time } = req.body;

  const updates = [];
  const values = [];

  if (base_price !== undefined) {
    updates.push('base_price = ?');
    values.push(base_price);
  }
  if (option_name !== undefined) {
    updates.push('option_name = ?');
    values.push(option_name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (processing_time !== undefined) {
    updates.push('processing_time = ?');
    values.push(processing_time);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(optionId);

  db.run(
    `UPDATE service_options SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update service option' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Service option not found' });
      }
      res.json({ message: 'Service option updated successfully' });
    }
  );
});

// Create visa request
app.post('/api/requests', authenticateToken, (req, res) => {
  const {
    category_id,
    service_option_id,
    applicant_name,
    passport_number,
    nationality,
    travel_date
  } = req.body;

  if (!category_id || !service_option_id || !applicant_name || !passport_number || !nationality) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  // Get the price for the service option
  db.get(
    'SELECT base_price FROM service_options WHERE id = ?',
    [service_option_id],
    (err, option) => {
      if (err || !option) {
        return res.status(400).json({ error: 'Invalid service option' });
      }

      db.run(
        `INSERT INTO visa_requests (user_id, category_id, service_option_id, applicant_name, 
         passport_number, nationality, travel_date, total_amount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          category_id,
          service_option_id,
          applicant_name,
          passport_number,
          nationality,
          travel_date,
          option.base_price
        ],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create request' });
          }

          res.status(201).json({
            message: 'Visa request submitted successfully',
            request_id: this.lastID,
            total_amount: option.base_price
          });
        }
      );
    }
  );
});

// Get user's visa requests
app.get('/api/requests', authenticateToken, (req, res) => {
  const query = `
    SELECT vr.*, vc.name as category_name, so.option_name, so.processing_time
    FROM visa_requests vr
    JOIN visa_categories vc ON vr.category_id = vc.id
    JOIN service_options so ON vr.service_option_id = so.id
    WHERE vr.user_id = ?
    ORDER BY vr.created_at DESC
  `;

  db.all(query, [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }
    res.json(rows);
  });
});

// Get all visa requests (admin view)
app.get('/api/admin/requests', authenticateToken, (req, res) => {
  const query = `
    SELECT vr.*, vc.name as category_name, so.option_name, so.processing_time,
           u.email as user_email, u.full_name as user_name
    FROM visa_requests vr
    JOIN visa_categories vc ON vr.category_id = vc.id
    JOIN service_options so ON vr.service_option_id = so.id
    JOIN users u ON vr.user_id = u.id
    ORDER BY vr.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }
    res.json(rows);
  });
});

// Update request status
app.put('/api/requests/:requestId/status', authenticateToken, (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'processing', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    'UPDATE visa_requests SET status = ? WHERE id = ?',
    [status, requestId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update status' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }
      res.json({ message: 'Request status updated successfully' });
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Immigration Support API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
