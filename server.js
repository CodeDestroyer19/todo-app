const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "todos.json");
const USERS_FILE = path.join(__dirname, "users.json");
const JWT_SECRET = "todo-app-secret-key"; // In production, use environment variable!

// Middleware
app.use(cors()); // Allow requests from our frontend
app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname))); // Serve static files from root

// Simple Request Logger Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next(); // Pass control to the next middleware/handler
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Helper function to read todo data
async function readTodoData() {
  console.log("Attempting to read todo data file...");
  try {
    const data = await fs.readFile(DATA_FILE, "utf8");
    console.log("Todo data file read successfully.");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("Todo data file not found, returning empty array.");
      return []; // If file doesn't exist, return empty array
    }
    console.error("Error reading todo data file:", error);
    throw error; // Rethrow other errors
  }
}

// Helper function to write todo data
async function writeTodoData(data) {
  console.log("Attempting to write todo data file...");
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    console.log("Todo data file written successfully.");
  } catch (error) {
    console.error("Error writing todo data file:", error);
    throw error;
  }
}

// Helper function to read user data
async function readUserData() {
  console.log("Attempting to read user data file...");
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    console.log("User data file read successfully.");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("User data file not found, returning empty array.");
      return []; // If file doesn't exist, return empty array
    }
    console.error("Error reading user data file:", error);
    throw error; // Rethrow other errors
  }
}

// Helper function to write user data
async function writeUserData(data) {
  console.log("Attempting to write user data file...");
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), "utf8");
    console.log("User data file written successfully.");
  } catch (error) {
    console.error("Error writing user data file:", error);
    throw error;
  }
}

// --- AUTH Endpoints ---

// POST /auth/register - Register a new user
app.post("/auth/register", async (req, res) => {
  console.log("POST /auth/register request received");
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const users = await readUserData();

    // Check if username already exists
    if (users.some((user) => user.username === username)) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Add new user
    const newUser = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
    };

    users.push(newUser);
    await writeUserData(users);

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
      },
    });
  } catch (error) {
    console.error("Error in POST /auth/register:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

// POST /auth/login - Login a user
app.post("/auth/login", async (req, res) => {
  console.log("POST /auth/login request received");
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const users = await readUserData();

    // Find user
    const user = users.find((user) => user.username === username);

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Error in POST /auth/login:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});

// --- TODO Endpoints ---

// GET /todos - Retrieve all todos for a user
app.get("/todos", authenticateToken, async (req, res) => {
  console.log(`GET /todos request received for user ${req.user.username}`);
  try {
    const todos = await readTodoData();
    // Filter todos for this user
    const userTodos = todos.filter((todo) => todo.userId === req.user.id);
    console.log(
      `Sending ${userTodos.length} todos for user ${req.user.username}.`
    );
    res.status(200).json(userTodos);
  } catch (error) {
    console.error("Error in GET /todos:", error);
    res.status(500).json({ message: "Error reading todos" });
  }
});

// POST /todos - Create a new todo for a user
app.post("/todos", authenticateToken, async (req, res) => {
  console.log(
    `POST /todos request received for user ${req.user.username}, body:`,
    req.body
  );
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim() === "") {
      console.log("Invalid todo text received:", text);
      return res.status(400).json({ message: "Invalid todo text" });
    }

    const todos = await readTodoData();
    const newTodo = {
      id: Date.now().toString(),
      userId: req.user.id,
      text: text.trim(),
      completed: false,
    };
    console.log(`Creating new todo for user ${req.user.username}:`, newTodo);
    todos.push(newTodo);
    await writeTodoData(todos);
    res.status(201).json(newTodo);
  } catch (error) {
    console.error("Error in POST /todos:", error);
    res.status(500).json({ message: "Error creating todo" });
  }
});

// DELETE /todos/completed - Delete all completed todos for a user
app.delete("/todos/completed", authenticateToken, async (req, res) => {
  console.log(
    `DELETE /todos/completed request received for user ${req.user.username}`
  );
  try {
    const todos = await readTodoData();
    const userTodos = todos.filter((todo) => todo.userId === req.user.id);

    // Find completed todos for this user
    const completedTodos = userTodos.filter((todo) => todo.completed);
    const completedCount = completedTodos.length;

    console.log(
      `Found ${completedCount} completed todos to delete for user ${req.user.username}.`
    );

    if (completedCount === 0) {
      console.log(
        `No completed todos found to delete for user ${req.user.username}.`
      );
      return res.status(204).send(); // No content to return
    }

    // Keep all todos that are either not completed OR belong to other users
    const remainingTodos = todos.filter(
      (todo) => todo.userId !== req.user.id || !todo.completed
    );

    console.log(`Keeping ${remainingTodos.length} todos in total.`);

    await writeTodoData(remainingTodos);
    console.log(
      `Successfully deleted ${completedCount} completed todos for user ${req.user.username}.`
    );

    res.status(200).json({
      message: `Deleted ${completedCount} completed todos.`,
      deletedCount: completedCount,
    });
  } catch (error) {
    console.error(
      `Error in DELETE /todos/completed for user ${req.user.username}:`,
      error
    );
    res.status(500).json({ message: "Error clearing completed todos" });
  }
});

// PUT /todos/:id - Update a todo for a user
app.put("/todos/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  console.log(
    `PUT /todos/${id} request received for user ${req.user.username}, body:`,
    req.body
  );
  try {
    const { text, completed } = req.body;

    // Validate: Check if at least one valid field is provided
    const isTextUpdate = text !== undefined && typeof text === "string";
    const isCompletedUpdate = typeof completed === "boolean";

    if (!isTextUpdate && !isCompletedUpdate) {
      console.log(`Invalid update data for id ${id}:`, req.body);
      return res.status(400).json({
        message: "Invalid update data: provide valid text or completed status",
      });
    }

    const todos = await readTodoData();
    const todoIndex = todos.findIndex(
      (todo) => todo.id === id && todo.userId === req.user.id
    );

    if (todoIndex === -1) {
      console.log(
        `Todo with id ${id} not found for user ${req.user.username}.`
      );
      return res.status(404).json({ message: "Todo not found" });
    }

    console.log(
      `Updating todo id ${id} for user ${req.user.username}. Current:`,
      todos[todoIndex]
    );

    // Update fields if provided and valid
    if (isTextUpdate) {
      const trimmedText = text.trim();
      if (trimmedText !== "") {
        // Prevent updating to empty string
        todos[todoIndex].text = trimmedText;
        console.log(`Updated text for id ${id} to:`, trimmedText);
      } else {
        console.log(`Skipping empty text update for id ${id}`);
      }
    }
    if (isCompletedUpdate) {
      todos[todoIndex].completed = completed;
      console.log(`Updated completed status for id ${id} to:`, completed);
    }

    await writeTodoData(todos);
    res.status(200).json(todos[todoIndex]);
  } catch (error) {
    console.error(
      `Error in PUT /todos/${id} for user ${req.user.username}:`,
      error
    );
    res.status(500).json({ message: "Error updating todo" });
  }
});

// DELETE /todos/:id - Delete a todo for a user
app.delete("/todos/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  console.log(
    `DELETE /todos/${id} request received for user ${req.user.username}`
  );
  try {
    let todos = await readTodoData();
    const initialLength = todos.length;

    // Only delete the todo if it belongs to the authenticated user
    todos = todos.filter(
      (todo) => !(todo.id === id && todo.userId === req.user.id)
    );

    if (todos.length === initialLength) {
      console.log(
        `Todo with id ${id} not found for user ${req.user.username}.`
      );
      return res.status(404).json({ message: "Todo not found" });
    }

    console.log(`Deleting todo id ${id} for user ${req.user.username}.`);
    await writeTodoData(todos);
    res.status(204).send(); // No content to send back
  } catch (error) {
    console.error(
      `Error in DELETE /todos/${id} for user ${req.user.username}:`,
      error
    );
    res.status(500).json({ message: "Error deleting todo" });
  }
});

// Start the server
// Listen on all network interfaces (needed for Render) and the provided PORT
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
