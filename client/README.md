# TeamFlow - Team Management System

A modern team management system for tracking tasks, team members, and
equipment.

## Features

- 👥 Team & Member Management
- ✅ Task Assignment & Tracking
- 📱 Equipment Inventory
- 📊 Performance Analytics
- 🔐 User Authentication & Authorization
- 🌓 Light & Dark Mode
- 🎛️ Admin & Team Leader Dashboards

## Backend Connectivity Options

The application offers multiple connectivity options to accommodate
different development and testing scenarios:

1. **Connect to a Backend Server**: Point the application to your
   backend API server
2. **Use Mock API**: Work with sample data without a backend server
   for testing and development

## Quick Start

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the setup script:

   ```bash
   npm run setup
   ```

   This will guide you through configuring your API connection
   settings.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration

### Backend URL

You can configure the backend API URL in one of these ways:

1. **During Setup**: Run `npm run setup` and follow the prompts
2. **Manually**: Edit the `.env` file and set `VITE_API_URL`
3. **URL Parameter**: Add `?apiUrl=https://your-api-url.com` to the
   URL when accessing the app

### Mock API Mode

Enable the mock API mode for development without a backend:

1. **During Setup**: Run `npm run setup` and choose to use mock data
2. **Manually**: Edit the `.env` file and set `VITE_USE_MOCK_API=true`
3. **URL Parameter**: Add `?mock=true` to the URL when accessing the
   app

## Mock API Credentials

When using the mock API, you can log in with the following
credentials:

- **Admin User**:

  - Email: john@example.com
  - Password: password

- **Team Leader**:

  - Email: jane@example.com
  - Password: password

- **Team Member**:
  - Email: robert@example.com
  - Password: password

## Troubleshooting Backend Connectivity

If you're having trouble connecting to the backend:

1. **Check API Status**: Look for the API status indicator in the
   bottom right corner (visible in development mode)
2. **Verify Backend Server**: Ensure your backend server is running
   and accessible
3. **CORS Settings**: Make sure your backend server allows requests
   from your frontend origin
4. **Try Mock Mode**: Enable mock mode to verify the frontend works
   correctly: `?mock=true`
5. **API Logs**: Check the browser console for detailed API error
   messages

## Development

### Directory Structure

- `/src/components` - React components
- `/src/context` - React context providers (auth, theme)
- `/src/services` - API services and utilities
- `/src/utils` - Helper functions and utilities
- `/public` - Static assets

### Technology Stack

- **Framework**: React with TypeScript
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Authentication**: JWT

## Deployment

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## License

[MIT](LICENSE)
