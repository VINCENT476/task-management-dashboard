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

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

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
        task.name.toLowerCase().includes(searchText)
        
    );
 
    if (sortTasks.value === "priority") {
    const priorityOrder = {
        High: 1,
        Medium: 2,
        Low: 3
    };

    filteredTasks.sort((a, b) =>
        priorityOrder[a.priority || "Medium"] -
        priorityOrder[b.priority || "Medium"]
    );

} else if (sortTasks.value === "date") {
    filteredTasks.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
    });
}
    filteredTasks.forEach(task => {
        const index = tasks.indexOf(task);
        const li = document.createElement("li");

        const priority = task.priority || "Medium";

        li.innerHTML = `
            <span style="text-decoration: ${task.completed ? 'line-through' : 'none'}">
                ${task.name}
            </span>

            <span class="priority-${priority.toLowerCase()}">
                Priority: ${priority}
            </span>

            <span>Due Date: ${task.date || "Not set"}</span>

            ${task.date && task.date < new Date().toLocaleDateString("en-CA") && !task.completed
                ? '<span class="overdue">OVERDUE</span>'
                : ''}

            <button onclick="completeTask(${index})">
                ${task.completed ? "Undo" : "Complete"}
            </button>

            <button onclick="editTask(${index})">Edit</button>

            <button onclick="deleteTask(${index})">Delete</button>
        `;

        taskList.appendChild(li);
    });

    updateSummary();
}

function clearAllTasks() {
    if (tasks.length === 0) {
        alert("There are no tasks to clear!");
        return;
    }

    const confirmClear = confirm("Are you sure you want to delete all tasks?");

    if (confirmClear) {
        tasks = [];
        saveTasks();
        displayTasks();
    }
}

function addTask() {
    const taskName = taskInput.value.trim();

    if (taskName === "") {
        alert("Please enter a task!");
        return;
    }

    tasks.push({
        name: taskName,
        completed: false,
        priority: taskPriority.value,
        date: taskDate.value
    });

    taskInput.value = "";
    taskDate.value = "";

    saveTasks();
    displayTasks();
}

function completeTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    displayTasks();
}

function editTask(index) {
    const newTask = prompt("Edit your task:", tasks[index].name);

    if (newTask !== null && newTask.trim() !== "") {
        tasks[index].name = newTask.trim();
        saveTasks();
        displayTasks();
    }
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    displayTasks();
}

function filterTasks(filter) {
    currentFilter = filter;
    displayTasks();
}

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

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        addTask();
    }
});

searchInput.addEventListener("input", displayTasks);

sortTasks.addEventListener("change", displayTasks);

displayTasks();