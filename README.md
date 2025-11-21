# Amrutam Telemedicine Backend

Production-grade backend for Amrutam's telemedicine platform focusing on scalability, reliability, security, and observability.

## Features

- **User Management**: Registration, authentication, MFA, role-based access control
- **Doctor Management**: Doctor profiles, availability slots, specializations
- **Booking System**: Consultation booking with conflict handling
- **Consultation Lifecycle**: Schedule, start, complete, rate consultations
- **Prescription Management**: Digital prescriptions with medication tracking
- **Payment Integration**: Payment tracking and status management
- **Audit Logging**: Comprehensive audit trails for compliance
- **Analytics**: Admin dashboard with statistics and trends
- **Security**: JWT authentication, MFA, encryption, rate limiting
- **Observability**: Structured logging, Prometheus metrics, health checks
- **Scalability**: Redis caching, connection pooling, optimized queries

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for containerized setup)

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/Mridul-Tilwaliya/telemed-platform.git
cd telemed-platform
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration (optional for local development)

4. Start services:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- API server

5. Run migrations:
```bash
docker-compose exec app npm run migrate:up
```

6. Access the API:
- API: http://localhost:5000
- Health Check: http://localhost:5000/health
- API Docs: http://localhost:5000/api-docs
- Metrics: http://localhost:5000/metrics

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Setup PostgreSQL database:
```bash
createdb amrutam_db
```

3. Setup Redis (if not using Docker):
```bash
redis-server
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Run migrations:
```bash
npm run migrate:up
```

6. Start development server:
```bash
npm run dev
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:integration` - Run integration tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run migrate:up` - Run database migrations
- `npm run migrate:down` - Rollback last migration
- `npm run migrate:create <name>` - Create new migration

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── database/        # Database connection and migrations
├── middleware/      # Express middleware
├── repositories/    # Data access layer
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
├── utils/           # Utility functions
├── validations/     # Request validation schemas
├── test/            # Test files
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## API Documentation

Interactive API documentation is available at `/api-docs` when the server is running.

### Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

#### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update profile
- `POST /api/v1/users/change-password` - Change password

#### Doctors
- `GET /api/v1/doctors` - List available doctors (with filters)
- `GET /api/v1/doctors/:id` - Get doctor details

#### Bookings
- `GET /api/v1/doctors/:doctorId/slots` - Get available slots
- `POST /api/v1/consultations` - Book consultation
- `DELETE /api/v1/consultations/:id` - Cancel consultation

#### Consultations
- `GET /api/v1/consultations` - Get user's consultations
- `POST /api/v1/consultations/:id/start` - Start consultation (doctor)
- `POST /api/v1/consultations/:id/complete` - Complete consultation (doctor)
- `POST /api/v1/consultations/:id/rating` - Add rating

#### Prescriptions
- `POST /api/v1/consultations/:id/prescriptions` - Create prescription (doctor)
- `GET /api/v1/prescriptions` - Get user's prescriptions
- `GET /api/v1/prescriptions/:id` - Get prescription details

#### Analytics (Admin only)
- `GET /api/v1/analytics/dashboard/stats` - Dashboard statistics
- `GET /api/v1/analytics/dashboard/trends` - Consultation trends

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Test Coverage
```bash
npm run test:coverage
```

## Database Migrations

Migrations are managed using `node-pg-migrate`.

### Create Migration
```bash
npm run migrate:create <migration-name>
```

### Run Migrations
```bash
npm run migrate:up
```

### Rollback Migration
```bash
npm run migrate:down
```

## Security

- **Authentication**: JWT with access and refresh tokens
- **MFA**: TOTP-based multi-factor authentication
- **Password**: Bcrypt hashing with strength validation
- **Rate Limiting**: Per-IP rate limiting on all endpoints
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection**: Parameterized queries only
- **XSS Protection**: Helmet.js security headers
- **CORS**: Configurable CORS policies
- **Audit Logging**: All sensitive operations logged

## Observability

### Logging
- Structured JSON logging with Winston
- Daily log rotation
- Separate error and combined logs
- Log levels: error, warn, info, debug

### Metrics
- Prometheus metrics endpoint at `/metrics`
- Request duration histograms
- Default Node.js metrics
- Custom business metrics

### Health Checks
- Health endpoint at `/health`
- Database connection check
- Redis connection check

## Performance

- **Caching**: Redis caching for frequently accessed data
- **Connection Pooling**: PostgreSQL connection pooling
- **Query Optimization**: Indexed database queries
- **Pagination**: All list endpoints support pagination
- **Idempotency**: Write operations support idempotency keys

## Deployment

### Docker

Build image:
```bash
docker build -t amrutam-api .
```

Run container:
```bash
docker run -p 5000:5000 --env-file .env amrutam-api
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests.

## Environment Variables

See `.env.example` for all available environment variables.

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue in the [repository](https://github.com/Mridul-Tilwaliya/telemed-platform).

