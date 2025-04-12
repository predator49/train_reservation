# Train Seat Reservation System

A web application for booking train seats with user authentication and real-time seat management.

## Features

- User registration and authentication
- Interactive seat booking interface
- Real-time seat availability updates
- Maximum 7 seats booking per transaction
- Priority booking for seats in the same row
- Booking management (view and cancel bookings)
- Responsive design for all devices

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express.js
- Database: PostgreSQL
- Styling: CSS with responsive design

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd train-reservation
```

2. Install frontend dependencies:
```bash
npm install
```

3. Create a .env file in the root directory with the following variables:
```
REACT_APP_API_URL=http://localhost:3001/api
```

4. Start the development server:
```bash
npm start
```

The application will be available at http://localhost:3000

## Project Structure

```
train-reservation/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── context/       # React context providers
│   ├── services/      # API services
│   ├── styles/        # CSS styles
│   └── utils/         # Utility functions
├── public/           # Static files
└── package.json      # Project dependencies
```

## API Documentation

### Authentication Endpoints

- POST /api/auth/register
  - Register a new user
  - Body: { name, email, password }

- POST /api/auth/login
  - Login user
  - Body: { email, password }

- POST /api/auth/logout
  - Logout user
  - Requires authentication

### Seat Management Endpoints

- GET /api/seats
  - Get all seats with their status
  - Requires authentication

- POST /api/seats/book
  - Book selected seats
  - Body: { seatIds: number[] }
  - Requires authentication

- POST /api/seats/cancel
  - Cancel seat booking
  - Body: { seatIds: number[] }
  - Requires authentication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details 