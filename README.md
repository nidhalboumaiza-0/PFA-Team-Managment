# Team Management Dashboard

A full-stack team management application with task tracking, equipment management, and performance analytics.

## Project Structure

```
project/
├── client/          # React frontend application
│   ├── src/         # Source code
│   ├── public/      # Static assets
│   └── ...          # Frontend configuration files
└── server/          # Express backend API
    ├── models/      # MongoDB models
    ├── routes/      # API routes
    └── ...          # Backend files
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Getting Started

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your MongoDB connection:
   ```
   MONGODB_URI=mongodb://localhost:27017/team-management
   PORT=5000
   JWT_SECRET=your_secret_key_here
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:5173

## Features

- **Dashboard**: Overview of team performance and task completion
- **Teams Management**: Create, update, and manage teams
- **Task Tracking**: Calendar-based task management system
- **Equipment Management**: Track and manage team equipment
- **User Management**: User profiles and role-based access

## Technology Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Axios for API calls
- Chart.js for analytics
- React Big Calendar for task scheduling

### Backend
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing

## Development

The application connects to the Express backend API for data storage and retrieval.

## Troubleshooting

### Frontend-Backend Connection Issues

1. **Test Connection**: Navigate to http://localhost:5173/test-connection to verify the frontend can connect to the backend.

2. **Common Issues**:
   - Ensure both frontend (port 5173) and backend (port 5000) are running
   - Check that MongoDB is running and accessible
   - Verify the API URL in `client/src/services/api.ts` matches your backend URL
   - Ensure CORS is properly configured in the backend

3. **Data Transformation**: The application includes data transformers in `client/src/utils/dataTransformers.ts` to handle differences between MongoDB document structure and frontend expectations.

## License

MIT 