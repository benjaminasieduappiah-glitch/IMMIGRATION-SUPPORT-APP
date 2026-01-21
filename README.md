# Ghana Immigration Support Services Application

A comprehensive web and mobile-responsive application for managing immigration support services for expats traveling to Ghana.

## Features

### 🔐 Authentication
- User registration and login system
- Secure JWT-based authentication
- Password hashing with bcrypt

### 📋 Visa Categories
1. **Visa on Arrival** - Two service options:
   - Standard Service ($150) - 24 hours processing
   - Express Service ($250) - 6 hours processing
2. **Work Permit Processing** ($500) - 5-7 business days
3. **Visa Extensions** ($200) - 3-5 business days
4. **Multiple Entry Visa** ($350) - 7-10 business days
5. **Okay to Board** ($100) - 12-24 hours

### 💰 Pricing Management
- Modifiable pricing for all services
- Different pricing tiers for service options
- Real-time pricing display

### 📱 Multi-Platform Support
- Responsive design for web and mobile devices
- Single-page application with React
- Mobile-first approach

## Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite3** database
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React 18** (loaded via CDN for simplicity)
- **Vanilla CSS** with responsive design
- Modern UI with gradient backgrounds and card layouts

## Installation

1. Clone the repository:
```bash
git clone https://github.com/benjaminasieduappiah-glitch/IMMIGRATION-SUPPORT-APP.git
cd IMMIGRATION-SUPPORT-APP
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your settings (JWT secret, etc.)

5. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:5000`

## Usage

### For Clients

1. **Register/Login**: Create an account or log in to access services
2. **Select Service**: Choose from available visa categories
3. **Choose Option**: Select service option (e.g., Standard or Express for Visa on Arrival)
4. **Fill Application**: Enter applicant details (name, passport, nationality, travel date)
5. **Submit Request**: Review and submit your application
6. **Track Status**: View all your requests and their current status

### For Administrators

Administrators can:
- View all client requests
- Update request status (pending → processing → approved/rejected)
- Modify service pricing through the API

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Visa Services
- `GET /api/categories` - Get all visa categories
- `GET /api/service-options` - Get all service options with pricing
- `GET /api/categories/:categoryId/options` - Get options for specific category

### Requests
- `POST /api/requests` - Submit new visa request (requires auth)
- `GET /api/requests` - Get user's requests (requires auth)
- `GET /api/admin/requests` - Get all requests (requires auth)
- `PUT /api/requests/:requestId/status` - Update request status (requires auth)

### Pricing Management
- `PUT /api/service-options/:optionId` - Update service option pricing (requires auth)

## Database Schema

### Users
- id, email, password, full_name, phone, created_at

### Visa Categories
- id, name, description, category_type

### Service Options
- id, category_id, option_name, description, base_price, processing_time

### Visa Requests
- id, user_id, category_id, service_option_id, applicant_name, passport_number, nationality, travel_date, status, total_amount, created_at

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Protected API endpoints
- SQL injection prevention through parameterized queries
- CORS enabled for cross-origin requests

## Responsive Design

The application is fully responsive and works on:
- Desktop computers (1200px+)
- Tablets (768px - 1200px)
- Mobile phones (< 768px)

## Future Enhancements

- Document upload functionality
- Payment gateway integration
- Email notifications
- SMS alerts for status updates
- Admin dashboard
- Multi-language support
- Document verification system

## License

ISC

## Support

For support, email: support@ghanaimmigration.com
