# Dietkem - Dietitian Management System

A comprehensive system for dietitians to manage their clients, create diet plans, and track progress.

## Features

- User authentication and authorization
- Client management
- Measurement tracking
- Diet plan creation and management
- Food database integration
- Session management
- Real-time notifications

## Tech Stack

- Backend:
  - Node.js
  - Express.js
  - TypeScript
  - Drizzle ORM
  - PostgreSQL
  - WebSocket

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dietkem.git
cd dietkem
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=dietkem

# Server Configuration
PORT=3001
NODE_ENV=development

# Session Configuration
SESSION_SECRET=dietkem-secret-key

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

4. Create the database:
```bash
createdb dietkem
```

5. Run database migrations:
```bash
npm run migrate
```

## Development

1. Start the development server:
```bash
npm run dev
```

2. Generate database migrations:
```bash
npm run generate
```

3. View database with Drizzle Studio:
```bash
npm run studio
```

## Production

1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## API Documentation

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Clients

- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Measurements

- `GET /api/clients/:id/measurements` - Get client measurements
- `POST /api/clients/:id/measurements` - Add client measurement
- `DELETE /api/clients/:id/measurements/:measurementId` - Delete client measurement

## License

MIT 