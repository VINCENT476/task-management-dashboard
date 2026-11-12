
const taskInput = document.getElementById("taskInput");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");
const searchInput = document.getElementById("searchInput");
const sortTasks = document.getElementById("sortTasks");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

const API_URL = "http://localhost:5000/api/tasks";

let tasks = [];
let currentFilter = "all";

// Display errors
function showError(error) {
    console.error(error);
    alert("Something went wrong. Please check that your backend server is running.");
}

// GET: Load tasks from MongoDB
async function loadTasks() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load tasks");
        }

        tasks = await response.json();
        displayTasks();

    } catch (error) {
        showError(error);
    }
}

// Display tasks
function displayTasks() {
    taskList.innerHTML = "";

    let filteredTasks = [...tasks];

    if (currentFilter === "pending") {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (currentFilter === "completed") {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }

    const searchText = searchInput.value.toLowerCase().trim();

    filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchText)
    );

    if (sortTasks.value === "priority") {
        const priorityOrder = {
            High: 1,
            Medium: 2,
            Low: 3
        };

        filteredTasks.sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );

    } else if (sortTasks.value === "date") {
        filteredTasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }

    filteredTasks.forEach(task => {
        const li = document.createElement("li");

        const title = document.createElement("span");
        title.textContent = task.title;
        title.style.textDecoration = task.completed
            ? "line-through"
            : "none";

        const priority = document.createElement("span");
        priority.className = "priority-" + task.priority.toLowerCase();
        priority.textContent = "Priority: " + task.priority;

        const dueDate = document.createElement("span");
        dueDate.textContent = "Due Date: " +
            (task.dueDate ? task.dueDate.substring(0, 10) : "Not set");

        li.appendChild(title);
        li.appendChild(priority);
        li.appendChild(dueDate);

        if (task.dueDate && !task.completed) {
            const due = new Date(task.dueDate);
            const today = new Date();

            due.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            if (due < today) {
                const overdue = document.createElement("span");
                overdue.className = "overdue";
                overdue.textContent = "OVERDUE";
                li.appendChild(overdue);
            }
        }

        const completeBtn = document.createElement("button");
        completeBtn.textContent = task.completed ? "Undo" : "Complete";
        completeBtn.addEventListener("click", () => completeTask(task._id));

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => editTask(task._id));

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteTask(task._id));

        li.appendChild(completeBtn);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);

        taskList.appendChild(li);
    });

    updateSummary();
}

// DELETE: Clear all tasks
async function clearAllTasks() {
    if (tasks.length === 0) {
        alert("There are no tasks to clear!");
        return;
    }

    const confirmClear = confirm("Are you sure you want to delete all tasks?");

    if (!confirmClear) return;

    try {
        await Promise.all(
            tasks.map(task =>
                fetch(`${API_URL}/${task._id}`, {
                    method: "DELETE"
                }).then(response => {
                    if (!response.ok) {
                        throw new Error("Could not delete a task");
                    }
                })
            )
        );

        tasks = [];
        displayTasks();
        alert("All tasks deleted successfully!");

    } catch (error) {
        showError(error);
        await loadTasks();
    }
}

// POST: Add a new task
async function addTask() {
    const taskName = taskInput.value.trim();

    if (taskName === "") {
        alert("Please enter a task!");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: taskName,
                description: "",
                priority: taskPriority.value,
                dueDate: taskDate.value || null
            })
        });

        if (!response.ok) {
            throw new Error("Could not add task");
        }

        const newTask = await response.json();
        tasks.unshift(newTask);

        taskInput.value = "";
        taskDate.value = "";

        displayTasks();

    } catch (error) {
        showError(error);
    }
}

// PUT: Complete or undo a task
async function completeTask(id) {
    const task = tasks.find(task => task._id === id);

    if (!task) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                completed: !task.completed
            })
        });

        if (!response.ok) {
            throw new Error("Could not update task");
        }

        const updatedTask = await response.json();

        tasks = tasks.map(task =>
            task._id === id ? updatedTask : task
        );

        displayTasks();

    } catch (error) {
        showError(error);
    }
}

// PUT: Edit a task
async function editTask(id) {
    const task = tasks.find(task => task._id === id);

    if (!task) return;

    const newTask = prompt("Edit your task:", task.title);

    if (newTask === null || newTask.trim() === "") return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: newTask.trim()
            })
        });

        if (!response.ok) {
            throw new Error("Could not edit task");
        }

        const updatedTask = await response.json();

        tasks = tasks.map(task =>
            task._id === id ? updatedTask : task
        );

        displayTasks();

    } catch (error) {
        showError(error);
    }
}

// DELETE: Delete a task
async function deleteTask(id) {
    const confirmDelete = confirm("Are you sure you want to delete this task?");

    if (!confirmDelete) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Could not delete task");
        }

        tasks = tasks.filter(task => task._id !== id);
        displayTasks();

    } catch (error) {
        showError(error);
    }
}

// Filter tasks
function filterTasks(filter) {
    currentFilter = filter;
    displayTasks();
}

// Update dashboard statistics
function updateSummary() {
    totalTasks.textContent = tasks.length;

    const completed = tasks.filter(task => task.completed).length;

    completedTasks.textContent = completed;
    pendingTasks.textContent = tasks.length - completed;

    const progress = tasks.length === 0
        ? 0
        : Math.round((completed / tasks.length) * 100);

    progressFill.style.width = progress + "%";
    progressText.textContent = progress + "% Completed";
}

// Event listeners
addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        addTask();
    }
});

searchInput.addEventListener("input", displayTasks);
sortTasks.addEventListener("change", displayTasks);

// Load tasks when the page opens
loadTasks();
