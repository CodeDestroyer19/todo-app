// Frontend JavaScript for ToDo App

document.addEventListener("DOMContentLoaded", () => {
  // Dynamically determine API base URL:
  // In production, API and frontend are served from same origin
  // In development, use localhost:3000
  const isProduction =
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  const apiBaseUrl = isProduction ? "" : "http://localhost:3000";
  const apiUrl = `${apiBaseUrl}/todos`; // Our todo endpoints

  console.log(
    `App running in ${isProduction ? "production" : "development"} mode.`
  );
  console.log(`Using API base URL: ${apiBaseUrl || "same origin"}`);

  // Auth elements
  const authContainer = document.getElementById("auth-container");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginToggle = document.getElementById("login-toggle");
  const registerToggle = document.getElementById("register-toggle");
  const loginError = document.getElementById("login-error");
  const registerError = document.getElementById("register-error");

  // Todo elements
  const todoContainer = document.getElementById("todo-container");
  const todoInput = document.getElementById("todo-input");
  const addButton = document.getElementById("add-button");
  const todoList = document.getElementById("todo-list");
  const usernameDisplay = document.getElementById("username-display");
  const logoutButton = document.getElementById("logout-button");

  let currentFilter = "all"; // Possible values: 'all', 'active', 'completed'
  let allTodos = []; // Store all fetched todos locally
  let token = localStorage.getItem("token");
  let currentUser = null;

  // Check if user is logged in (token exists in localStorage)
  function checkAuthStatus() {
    token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");

    if (token && userJson) {
      try {
        currentUser = JSON.parse(userJson);
        showTodoApp();
      } catch (error) {
        console.error("Error parsing user data:", error);
        showAuthForms();
      }
    } else {
      showAuthForms();
    }
  }

  function showAuthForms() {
    authContainer.classList.remove("hidden");
    todoContainer.classList.add("hidden");
    // Clear any error messages
    loginError.textContent = "";
    registerError.textContent = "";
  }

  function showTodoApp() {
    authContainer.classList.add("hidden");
    todoContainer.classList.remove("hidden");
    // Display username
    if (currentUser) {
      usernameDisplay.textContent = currentUser.username;
    }
    // Fetch todos
    fetchTodos();
  }

  // Auth form toggle functionality
  loginToggle.addEventListener("click", () => {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    loginToggle.classList.add("active");
    registerToggle.classList.remove("active");
  });

  registerToggle.addEventListener("click", () => {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    loginToggle.classList.remove("active");
    registerToggle.classList.add("active");
  });

  // Handle login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
      loginError.textContent = "Please enter both username and password";
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        loginError.textContent = data.message || "Login failed";
        return;
      }

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      token = data.token;
      currentUser = data.user;

      // Reset form
      loginForm.reset();

      // Show todo app
      showTodoApp();
    } catch (error) {
      console.error("Error logging in:", error);
      loginError.textContent = "An error occurred during login";
    }
  });

  // Handle register
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    registerError.textContent = "";

    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value;
    const confirm = document.getElementById("register-confirm").value;

    if (!username || !password) {
      registerError.textContent = "Please enter both username and password";
      return;
    }

    if (password !== confirm) {
      registerError.textContent = "Passwords do not match";
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        registerError.textContent = data.message || "Registration failed";
        return;
      }

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      token = data.token;
      currentUser = data.user;

      // Reset form
      registerForm.reset();

      // Show todo app
      showTodoApp();
    } catch (error) {
      console.error("Error registering:", error);
      registerError.textContent = "An error occurred during registration";
    }
  });

  // Handle logout
  logoutButton.addEventListener("click", () => {
    // Clear stored auth data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    token = null;
    currentUser = null;
    allTodos = [];

    // Show auth forms
    showAuthForms();
  });

  // --- Fetch and Render Todos ---
  async function fetchTodos() {
    try {
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Token invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showAuthForms();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      allTodos = await response.json(); // Store fetched todos
      renderTodos(); // Render based on current filter
    } catch (error) {
      console.error("Error fetching todos:", error);
      if (todoList) {
        // Check if todoList is available
        todoList.innerHTML =
          "<li>Error loading todos. Please try again later.</li>";
      }
    }
  }

  // Modified renderTodos to use currentFilter and allTodos
  function renderTodos() {
    if (!todoList) return; // Ensure todoList exists

    let todosToRender;
    switch (currentFilter) {
      case "active":
        todosToRender = allTodos.filter((todo) => !todo.completed);
        break;
      case "completed":
        todosToRender = allTodos.filter((todo) => todo.completed);
        break;
      case "all":
      default:
        todosToRender = allTodos;
        break;
    }

    todoList.innerHTML = ""; // Clear existing list

    if (!Array.isArray(todosToRender)) {
      console.error("renderTodos received non-array:", todosToRender);
      todoList.innerHTML = "<li>Invalid data received.</li>";
      return;
    }

    if (todosToRender.length === 0) {
      if (currentFilter === "all") {
        todoList.innerHTML = "<li>No tasks yet!</li>";
      } else if (currentFilter === "active") {
        todoList.innerHTML = "<li>No active tasks!</li>";
      } else {
        todoList.innerHTML = "<li>No completed tasks!</li>";
      }
      return;
    }

    todosToRender.forEach((todo) => {
      if (
        !todo ||
        typeof todo.id === "undefined" ||
        typeof todo.text === "undefined"
      ) {
        console.warn("Skipping invalid todo item:", todo);
        return; // Skip invalid items
      }
      const listItem = document.createElement("li");

      // Checkbox (for completion toggle)
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.completed;
      checkbox.classList.add("todo-checkbox");
      checkbox.addEventListener("change", () =>
        toggleTodo(todo.id, checkbox.checked)
      );

      // Text span
      const textSpan = document.createElement("span");
      textSpan.textContent = todo.text;
      textSpan.classList.add("todo-text");
      textSpan.addEventListener("dblclick", () =>
        enableEditing(listItem, textSpan, todo)
      );
      if (todo.completed) {
        listItem.classList.add("completed");
      }

      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "×"; // iOS-style delete symbol
      deleteButton.classList.add("delete-button");
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent list item click events
        deleteTodo(todo.id);
      });

      listItem.dataset.id = todo.id;
      listItem.classList.add("todo-item");
      listItem.appendChild(checkbox);
      listItem.appendChild(textSpan);
      listItem.appendChild(deleteButton);
      todoList.appendChild(listItem);
    });
  }

  // --- Add Todo ---
  async function addTodo() {
    if (!todoInput) return;
    const text = todoInput.value.trim();
    if (text === "") {
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: text }),
      });

      if (response.status === 401 || response.status === 403) {
        // Token invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showAuthForms();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Clear the input field
      todoInput.value = "";
      // Re-fetch todos to update the list
      fetchTodos();
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  }

  // --- Toggle Todo Completion ---
  async function toggleTodo(id, completed) {
    try {
      const response = await fetch(`${apiUrl}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: completed }),
      });

      if (response.status === 401 || response.status === 403) {
        // Token invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showAuthForms();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Optimistic update
      const listItem = todoList.querySelector(`li[data-id="${id}"]`);
      if (listItem) {
        listItem.classList.toggle("completed", completed);
        const checkbox = listItem.querySelector(".todo-checkbox");
        if (checkbox) checkbox.checked = completed;
      }

      // Also update the stored todo
      const todoIndex = allTodos.findIndex((todo) => todo.id === id);
      if (todoIndex !== -1) {
        allTodos[todoIndex].completed = completed;
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
      // Revert optimistic update if API call failed
      fetchTodos();
    }
  }

  // --- Edit Todo --- (New Feature)
  function enableEditing(listItem, textSpan, todo) {
    // Check if already editing
    if (listItem.querySelector(".edit-input")) return;

    const originalText = todo.text;
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalText;
    input.classList.add("edit-input"); // For styling and identification

    // Replace span with input
    listItem.replaceChild(input, textSpan);
    input.focus(); // Focus the input

    // Event listeners for saving/canceling
    input.addEventListener("blur", () =>
      saveEdit(listItem, input, textSpan, todo)
    );
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        input.blur(); // Trigger blur event to save
      }
    });
  }

  async function saveEdit(listItem, input, textSpan, todo) {
    const newText = input.value.trim();

    // If text is empty or unchanged, revert without API call
    if (newText === "" || newText === todo.text) {
      listItem.replaceChild(textSpan, input); // Revert to original span
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/${todo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newText }),
      });

      if (response.status === 401 || response.status === 403) {
        // Token invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showAuthForms();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedTodo = await response.json();
      // Update the original span's text and replace input
      textSpan.textContent = updatedTodo.text;
      listItem.replaceChild(textSpan, input);
      // Update the todo object in case editing is re-enabled before full refresh
      todo.text = updatedTodo.text;

      // Also update the stored todo
      const todoIndex = allTodos.findIndex(
        (todo) => todo.id === updatedTodo.id
      );
      if (todoIndex !== -1) {
        allTodos[todoIndex].text = updatedTodo.text;
      }
    } catch (error) {
      console.error("Error saving todo edit:", error);
      // Revert to original text on error
      listItem.replaceChild(textSpan, input);
    }
  }

  // --- Delete Todo ---
  async function deleteTodo(id) {
    try {
      const response = await fetch(`${apiUrl}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Token invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showAuthForms();
        return;
      }

      if (!response.ok && response.status !== 204) {
        // 204 No Content is success
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Optimistic update
      allTodos = allTodos.filter((todo) => todo.id !== id);
      renderTodos();
    } catch (error) {
      console.error("Error deleting todo:", error);
      // Revert optimistic update if API call failed
      fetchTodos();
    }
  }

  // --- Clear Completed Todos ---
  async function clearCompletedTodos() {
    try {
      const response = await fetch(`${apiUrl}/completed`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Token invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showAuthForms();
        return;
      }

      // Handle both 204 (no content, nothing deleted) and 200 (success with message)
      if (response.status === 204) {
        console.log("No completed todos to delete");
      } else if (response.ok) {
        const result = await response.json();
        console.log(result.message);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchTodos(); // Refresh the list
    } catch (error) {
      console.error("Error clearing completed todos:", error);
    }
  }

  // --- Event Listeners ---
  if (addButton) {
    addButton.addEventListener("click", addTodo);
  }

  if (todoInput) {
    todoInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        addTodo();
      }
    });
  }

  const filterButtons = document.querySelectorAll(".filter-button");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all filter buttons
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      // Add active class to the clicked button
      button.classList.add("active");
      // Update filter state
      currentFilter = button.id.replace("filter-", ""); // e.g., 'all', 'active', 'completed'
      // Re-render the list with the new filter
      renderTodos();
    });
  });

  const clearCompletedButton = document.getElementById(
    "clear-completed-button"
  );
  if (clearCompletedButton) {
    clearCompletedButton.addEventListener("click", clearCompletedTodos);
  }

  // Check auth status when the app loads
  checkAuthStatus();
});
