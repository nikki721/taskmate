// State Management
let tasks = JSON.parse(localStorage.getItem("taskmate_tasks")) || [];
let activeFilter = "all";
let currentCalendarDate = new Date(2026, 7, 14); // August 2026
let selectedDate = null; // when set, task list is filtered to this calendar date (YYYY-MM-DD)

const quotes = [
  "Consistency is better than perfection.",
  "Small daily improvements lead to stunning results.",
  "Focus on being productive instead of busy.",
  "The secret of getting ahead is getting started.",
];
let quoteIndex = 0;

// Elements
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const priorityInput = document.getElementById("priority-input");
const dateInput = document.getElementById("date-input");
const timeInput = document.getElementById("time-input");
const taskList = document.getElementById("task-list");

const treeStage = document.getElementById("tree-stage");
const fruitStage = document.getElementById("fruit-stage");
const progressText = document.getElementById("progress-text");
const progressBarFill = document.getElementById("progress-bar-fill");

const statTotal = document.getElementById("stat-total");
const statCompleted = document.getElementById("stat-completed");
const statPending = document.getElementById("stat-pending");

// Notification Setup
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Initial Setup
dateInput.value = new Date().toISOString().split("T")[0];
updateClock();
setInterval(updateClock, 1000);
initEventListeners();
renderApp();

// --- Core Rendering Logic ---
function renderApp() {
  saveTasks();
  renderTasks();
  updateProgress();
  renderCalendar();
  renderOverview();
}

function saveTasks() {
  localStorage.setItem("taskmate_tasks", JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = "";

  let filtered = tasks;
  if (activeFilter === "completed")
    filtered = filtered.filter((t) => t.completed);
  if (activeFilter === "pending")
    filtered = filtered.filter((t) => !t.completed);
  if (selectedDate) filtered = filtered.filter((t) => t.date === selectedDate);

  if (filtered.length === 0) {
    const msg = selectedDate
      ? `No tasks found for ${selectedDate} 🌱`
      : "No tasks found 🌱";
    taskList.innerHTML = `<li style="text-align:center; padding: 20px; color: rgba(255,255,255,0.6); font-size: 0.9rem;">${msg}</li>`;
    return;
  }

  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;
    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} onchange="toggleTask(${task.id})">
      <div class="task-info">
        <span class="task-text">${escapeHTML(task.text)}</span>
        <div class="task-meta">
          <span class="badge ${task.priority}">${task.priority}</span>
          <span class="task-date-text">📅 ${task.date} ${task.time ? "⏰ " + task.time : ""}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="deleteTask(${task.id})" title="Delete">🗑️</button>
    `;
    taskList.appendChild(li);
  });
}

function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Text & Bar
  progressText.textContent = `${percentage}% Completed (${completed}/${total})`;
  progressBarFill.style.width = `${percentage}%`;

  // Stats Counters
  statTotal.textContent = total;
  statCompleted.textContent = completed;
  statPending.textContent = pending;

  // Tree Growth Progression - calculated purely from actual task completion data
  if (total === 0 || percentage === 0) {
    treeStage.textContent = "🌱";
    fruitStage.style.display = "none";
  } else if (percentage < 35) {
    treeStage.textContent = "🌿";
    fruitStage.style.display = "none";
  } else if (percentage < 70) {
    treeStage.textContent = "🌳";
    fruitStage.style.display = "none";
  } else if (percentage < 100) {
    treeStage.textContent = "🌳";
    fruitStage.style.display = "inline";
    fruitStage.textContent = "🌸";
  } else {
    treeStage.textContent = "🌳";
    fruitStage.style.display = "inline";
    fruitStage.textContent = "🌸";
  }
}

// Sidebar Calendar Rendering
function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  document.getElementById("cal-month-year").textContent =
    `${monthNames[month]} ${year}`;

  const daysContainer = document.getElementById("calendar-days");
  daysContainer.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Blank offset days
  for (let i = 0; i < firstDay; i++) {
    daysContainer.appendChild(document.createElement("div"));
  }

  const todayStr = new Date().toISOString().split("T")[0];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayEl = document.createElement("div");
    dayEl.className = "calendar-day";
    dayEl.textContent = d;

    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dayEl.dataset.date = formattedDate;

    if (formattedDate === todayStr) {
      dayEl.classList.add("active");
    }

    if (tasks.some((t) => t.date === formattedDate)) {
      dayEl.classList.add("has-task");
    }

    if (formattedDate === selectedDate) {
      dayEl.classList.add("selected");
    }

    daysContainer.appendChild(dayEl);
  }
}

// Side Ring & Overview Task List
function renderOverview() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("overview-subtitle").textContent =
    `${total} tasks • ${completed} completed`;
  document.getElementById("ring-text").textContent = `${percentage}%`;

  const ringGraphic = document.getElementById("ring-display");
  ringGraphic.style.background = `conic-gradient(var(--primary-green) ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`;

  const miniList = document.getElementById("today-task-mini-list");
  miniList.innerHTML = "";

  tasks.slice(0, 3).forEach((task) => {
    const li = document.createElement("li");
    li.className = `mini-task-item ${task.completed ? "completed" : ""}`;
    li.innerHTML = `
      <span>${task.completed ? "✅" : "🟦"}</span>
      <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(task.text)}</span>
    `;
    miniList.appendChild(li);
  });
}

// --- User Actions ---
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
  taskInput.value = "";
  timeInput.value = "";
  renderApp();
}

function toggleTask(id) {
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t,
  );
  renderApp();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  renderApp();
}

// --- Helpers ---
function updateClock() {
  const now = new Date();
  const dateOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  document.getElementById("current-date").textContent = now.toLocaleDateString(
    "en-GB",
    dateOptions,
  );
  document.getElementById("current-time").textContent = now.toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" },
  );
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

function initEventListeners() {
  taskForm.addEventListener("submit", addTask);

  // Filter Buttons
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      if (e.target.id === "filter-all") activeFilter = "all";
      if (e.target.id === "filter-completed") activeFilter = "completed";
      if (e.target.id === "filter-pending") activeFilter = "pending";

      // Switching status filters clears any active date filter from the calendar
      selectedDate = null;
      renderCalendar();
      renderTasks();
    });
  });

  // Calendar Controls
  document.getElementById("prev-month").addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("next-month").addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
  });

  // Calendar Day Click -> Filter tasks by that date (click again to clear)
  document.getElementById("calendar-days").addEventListener("click", (e) => {
    const dayEl = e.target.closest(".calendar-day");
    if (!dayEl || !dayEl.dataset.date) return;

    selectedDate =
      selectedDate === dayEl.dataset.date ? null : dayEl.dataset.date;
    renderCalendar();
    renderTasks();
  });
}

// Reminder Loop
setInterval(() => {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);

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
      saveTasks();
    }
  });
}, 30000);
