const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'immigration.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Visa service categories table
  db.run(`CREATE TABLE IF NOT EXISTS visa_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category_type TEXT NOT NULL
  )`);

  // Service options for categories (for Visa on Arrival's 2 options)
  db.run(`CREATE TABLE IF NOT EXISTS service_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    option_name TEXT NOT NULL,
    description TEXT,
    base_price REAL NOT NULL,
    processing_time TEXT,
    FOREIGN KEY (category_id) REFERENCES visa_categories(id)
  )`);

  // Client requests table
  db.run(`CREATE TABLE IF NOT EXISTS visa_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category_id INTEGER,
    service_option_id INTEGER,
    applicant_name TEXT NOT NULL,
    passport_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    travel_date DATE,
    status TEXT DEFAULT 'pending',
    total_amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES visa_categories(id),
    FOREIGN KEY (service_option_id) REFERENCES service_options(id)
  )`);

  // Insert default visa categories
  const categories = [
    { name: 'Visa on Arrival', description: 'Fast-track visa processing at airport', type: 'visa_on_arrival' },
    { name: 'Work Permit Processing', description: 'Application for work permits in Ghana', type: 'work_permit' },
    { name: 'Visa Extensions', description: 'Extend your existing visa', type: 'visa_extension' },
    { name: 'Multiple Entry Visa', description: 'Multiple entry visa for frequent travelers', type: 'multiple_entry' },
    { name: 'Okay to Board', description: 'Pre-clearance for boarding flights to Ghana', type: 'okay_to_board' }
  ];

  const insertCategory = db.prepare('INSERT OR IGNORE INTO visa_categories (name, description, category_type) VALUES (?, ?, ?)');
  categories.forEach(cat => {
    insertCategory.run(cat.name, cat.description, cat.type);
  });
  insertCategory.finalize();

  // Insert service options for Visa on Arrival (2 options with different pricing)
  db.run(`INSERT OR IGNORE INTO service_options (category_id, option_name, description, base_price, processing_time)
    SELECT id, 'Standard Service', 'Regular processing within 24 hours', 150.00, '24 hours'
    FROM visa_categories WHERE category_type = 'visa_on_arrival'`);

  db.run(`INSERT OR IGNORE INTO service_options (category_id, option_name, description, base_price, processing_time)
    SELECT id, 'Express Service', 'Priority processing within 6 hours', 250.00, '6 hours'
    FROM visa_categories WHERE category_type = 'visa_on_arrival'`);

  // Insert default service options for other categories
  db.run(`INSERT OR IGNORE INTO service_options (category_id, option_name, description, base_price, processing_time)
    SELECT id, 'Standard Processing', 'Regular work permit application', 500.00, '5-7 business days'
    FROM visa_categories WHERE category_type = 'work_permit'`);

  db.run(`INSERT OR IGNORE INTO service_options (category_id, option_name, description, base_price, processing_time)
    SELECT id, 'Extension Service', 'Visa extension processing', 200.00, '3-5 business days'
    FROM visa_categories WHERE category_type = 'visa_extension'`);

  db.run(`INSERT OR IGNORE INTO service_options (category_id, option_name, description, base_price, processing_time)
    SELECT id, 'Multiple Entry Package', 'Multiple entry visa application', 350.00, '7-10 business days'
    FROM visa_categories WHERE category_type = 'multiple_entry'`);

  db.run(`INSERT OR IGNORE INTO service_options (category_id, option_name, description, base_price, processing_time)
    SELECT id, 'Okay to Board Request', 'Pre-clearance request processing', 100.00, '12-24 hours'
    FROM visa_categories WHERE category_type = 'okay_to_board'`);
});

module.exports = db;
