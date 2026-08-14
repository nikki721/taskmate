// State & Elements
let tasks = JSON.parse(localStorage.getItem("taskmate_tasks")) || [];

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const priorityInput = document.getElementById("priority-input");
const dateInput = document.getElementById("date-input");
const timeInput = document.getElementById("time-input");
const taskList = document.getElementById("task-list");
const filterDate = document.getElementById("filter-date");
const clearFilterBtn = document.getElementById("clear-filter-btn");
const treeStage = document.getElementById("tree-stage");
const progressText = document.getElementById("progress-text");

// Request Notification Permission on Load
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Set default date picker to today
dateInput.valueToDate = new Date();
dateInput.value = new Date().toISOString().split("T")[0];

// Initialize
renderTasks();

// --- Functions ---

function saveAndRender() {
  localStorage.setItem("taskmate_tasks", JSON.stringify(tasks));
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = "";

  const selectedDate = filterDate.value;
  const filteredTasks = selectedDate
    ? tasks.filter((t) => t.date === selectedDate)
    : tasks;

  filteredTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;

    li.innerHTML = `
      <input type="checkbox" ${task.completed ? "checked" : ""} onchange="toggleTask(${task.id})">
      <div class="task-info">
        <span class="task-text">${escapeHTML(task.text)}</span>
        <div>
          <span class="badge ${task.priority}">${task.priority}</span>
          <span class="task-date">📅 ${task.date} ${task.time ? "⏰ " + task.time : ""}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️</button>
    `;

    taskList.appendChild(li);
  });

  updateProgress();
}

function updateProgress() {
  if (tasks.length === 0) {
    progressText.textContent = "0% Completed (0/0)";
    treeStage.textContent = "🌱";
    return;
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const percentage = Math.round((completedCount / tasks.length) * 100);

  progressText.textContent = `${percentage}% Completed (${completedCount}/${tasks.length})`;

  // Visual Tree Growth Logic
  if (percentage === 0) treeStage.textContent = "🌱";
  else if (percentage < 35) treeStage.textContent = "🌿";
  else if (percentage < 70) treeStage.textContent = "🪴";
  else if (percentage < 100) treeStage.textContent = "🌳";
  else treeStage.textContent = "🌳🍎"; // Fully grown with fruit!
}

function addTask(e) {
  e.preventDefault();

  const newTask = {
    id: Date.now(),
    text: taskInput.value.trim(),
    priority: priorityInput.value,
    date: dateInput.value,
    time: timeInput.value,
    completed: false,
    notified: false,
  };

  tasks.push(newTask);
  saveAndRender();

  taskInput.value = "";
  timeInput.value = "";
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task,
  );
  saveAndRender();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveAndRender();
}

function escapeHTML(str) {
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        tag
      ] || tag,
  );
}

// --- Basic Reminder Checker ---
setInterval(() => {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM

  tasks.forEach((task) => {
    if (
      !task.completed &&
      !task.notified &&
      task.date === currentDate &&
      task.time === currentTime
    ) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Task Reminder! 🔔", {
          body: `Time to: ${task.text}`,
          icon: "🌱",
        });
      } else {
        alert(`🔔 Reminder: ${task.text}`);
      }
      task.notified = true;
      localStorage.setItem("taskmate_tasks", JSON.stringify(tasks));
    }
  });
}, 30000); // Check every 30 seconds

// --- Event Listeners ---
taskForm.addEventListener("submit", addTask);
filterDate.addEventListener("change", renderTasks);
clearFilterBtn.addEventListener("click", () => {
  filterDate.value = "";
  renderTasks();
});
