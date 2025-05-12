# iOS-Style Todo App

A full-featured Todo application with user authentication and a clean iOS-inspired design. Users can create accounts, manage their own todo lists, filter by status, and more.

## Features

- **User Authentication**

  - Register new accounts
  - Login/logout functionality
  - Secure password storage with bcrypt
  - JWT token-based authentication

- **Todo Management**

  - Create new tasks
  - Mark tasks as complete/incomplete
  - Edit task text (double-click)
  - Delete individual tasks
  - Clear all completed tasks

- **Filtering**

  - View all tasks
  - Filter by active tasks
  - Filter by completed tasks

- **iOS-Inspired Design**
  - Clean, minimalist UI
  - iOS color scheme and styling
  - Responsive layout

## Technologies Used

- **Frontend**
  - HTML5
  - CSS3
  - Vanilla JavaScript (ES6+)
- **Backend**

  - Node.js
  - Express.js
  - JWT for authentication
  - bcrypt for password hashing

- **Data Storage**
  - JSON files (todos.json, users.json)

## Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd todo-app
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:

   - Create a `.env` file in the project root based on these example values:

   ```
   PORT=3000
   JWT_SECRET=your-secret-key-change-me-in-production
   NODE_ENV=development
   ```

4. Start the development server:

   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication

- **POST /auth/register** - Register a new user

  ```json
  { "username": "example", "password": "securepassword" }
  ```

- **POST /auth/login** - Login a user
  ```json
  { "username": "example", "password": "securepassword" }
  ```

### Todos

All Todo endpoints require authentication (JWT token in Authorization header)

- **GET /todos** - Get all todos for the authenticated user
- **POST /todos** - Create a new todo
  ```json
  { "text": "Task description" }
  ```
- **PUT /todos/:id** - Update a todo
  ```json
  { "text": "Updated text" }
  ```
  or
  ```json
  { "completed": true }
  ```
- **DELETE /todos/:id** - Delete a specific todo
- **DELETE /todos/completed** - Delete all completed todos

## Deployment

This app is configured for deployment on Render:

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Create a new Web Service on Render
3. Connect to your Git repository
4. Set environment variables:

   - `NODE_ENV=production` (required)
   - `JWT_SECRET=your-secure-secret-key` (required, use a strong random value)
   - `PORT=10000` (Render will override this, but good to include)
   - `ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com` (optional, for CORS)

5. Use the following settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 20.x or later

## Data Persistence

The app uses JSON files for data storage. For a production environment, consider using a database like MongoDB or PostgreSQL instead.

## License

MIT
