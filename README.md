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

1. Install Node.js 18 or newer and MongoDB, then start MongoDB locally or prepare an Atlas connection.
2. From the repository root, install both the client and server dependencies:

   ```bash
   npm run install:all
   ```

3. Create `server/.env`:

   ```dotenv
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/team-management
   PORT=5000
   JWT_SECRET=replace-with-a-long-random-value
   ```

4. Create `client/.env` so Vite can reach the backend:

   ```dotenv
   VITE_API_URL=http://localhost:5000/api
   ```

5. Start the backend from the repository root:

   ```bash
   npm run dev:server
   ```

6. In a second terminal, start the frontend:

   ```bash
   npm run dev:client
   ```

7. Open `http://localhost:5173`. The backend listens on `http://localhost:5000` by default.

Optional development users can be created from `server/` with `npm run create-admin` or `npm run create-test-users` after MongoDB is connected.

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
