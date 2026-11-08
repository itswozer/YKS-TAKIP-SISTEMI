"use strict";

const STORAGE_KEYS = {
  notes: "odak-yks-notes",
  tasks: "odak-yks-tasks",
  exams: "odak-yks-exams",
  goals: "odak-yks-goals",
  targetProfile: "odak-yks-target-profile",
  resources: "odak-yks-resources"
};

const DEFAULT_GOALS = { TYT: 100, AYT: 70 };
const $ = (selector) => document.querySelector(selector);
const viewAnimationHandlers = new WeakMap();
const RECOMMENDED_RESOURCES = {
  Matematik: [
    { name: "Rehber Matematik", description: "TYT ve AYT matematik konu anlatımları, kamp ve soru çözümleri.", query: "Rehber Matematik YKS" },
    { name: "Eyüp B.", description: "Özellikle AYT matematik ve yeni nesil soru çözümleri.", query: "Eyüp B AYT Matematik" }
  ],
  Türkçe: [
    { name: "Rüştü Hoca", description: "TYT Türkçe, paragraf ve dil bilgisi konu anlatımları.", query: "Rüştü Hoca TYT Türkçe" },
    { name: "Türkçenin Matematiği", description: "Paragraf ve Türkçe soru çözüm pratikleri.", query: "Türkçenin Matematiği TYT" }
  ],
  Fizik: [
    { name: "Fizikfinito", description: "TYT ve AYT fizik konuları ile soru çözüm videoları.", query: "Fizikfinito YKS Fizik" },
    { name: "VIP Fizik", description: "Fizik konu anlatımı ve sınav odaklı soru çözümleri.", query: "VIP Fizik YKS" }
  ],
  Kimya: [
    { name: "Kimya Adası", description: "TYT ve AYT kimya konu anlatımları ve soru çözümleri.", query: "Kimya Adası YKS" },
    { name: "Görkem Şahin", description: "Kimya dersleri, konu tekrarları ve sınav hazırlığı.", query: "Görkem Şahin YKS Kimya" }
  ],
  Biyoloji: [
    { name: "Dr. Biyoloji", description: "TYT ve AYT biyoloji konu anlatımı ve tekrar videoları.", query: "Dr Biyoloji YKS" },
    { name: "Biosem", description: "Biyoloji konuları ve sınav odaklı soru çözümleri.", query: "Biosem YKS Biyoloji" }
  ],
  "Sosyal Bilimler": [
    { name: "Benim Hocam", description: "TYT sosyal bilimler ve AYT tarih ders içerikleri.", query: "Benim Hocam TYT AYT Tarih" },
    { name: "Coğrafyanın Kodları", description: "TYT ve AYT coğrafya konu anlatımı ve harita çalışmaları.", query: "Coğrafyanın Kodları YKS" }
  ]
};

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored);
  } catch (error) {
    console.error(`"${key}" verisi okunamadı:`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`"${key}" verisi kaydedilemedi:`, error);
    window.alert("Veriler kaydedilemedi. Tarayıcı depolama alanınızı kontrol edin.");
    return false;
  }
}

function isValidTargetProfile(value) {
  return value && typeof value.university === "string" && value.university.trim() &&
    typeof value.department === "string" && value.department.trim() &&
    Number.isFinite(value.net) && value.net >= 0 && value.net <= 300 &&
    typeof value.quote === "string" && value.quote.trim();
}

function isValidResourceList(value) {
  return Array.isArray(value) && value.every((resource) =>
    resource && typeof resource.id === "string" &&
    typeof resource.subject === "string" &&
    typeof resource.name === "string" &&
    typeof resource.description === "string" &&
    typeof resource.url === "string" &&
    isSafeResourceUrl(resource.url)
  );
}

function isSafeResourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidTaskList(value) {
  return Array.isArray(value) && value.every((task) =>
    task && typeof task.id === "string" && typeof task.text === "string" && typeof task.completed === "boolean"
  );
}

function isValidExamList(value) {
  return Array.isArray(value) && value.every((exam) =>
    exam && typeof exam.id === "string" && (exam.type === "TYT" || exam.type === "AYT") &&
    typeof exam.date === "string" && Number.isFinite(exam.net) && exam.net >= 0
  );
}

function loadGoals() {
  const saved = readStorage(STORAGE_KEYS.goals, DEFAULT_GOALS);
  if (!saved || typeof saved !== "object") return { ...DEFAULT_GOALS };
  return {
    TYT: Number.isFinite(saved.TYT) && saved.TYT > 0 ? saved.TYT : DEFAULT_GOALS.TYT,
    AYT: Number.isFinite(saved.AYT) && saved.AYT > 0 ? saved.AYT : DEFAULT_GOALS.AYT
  };
}

let tasks = readStorage(STORAGE_KEYS.tasks, []);
if (!isValidTaskList(tasks)) tasks = [];
let exams = readStorage(STORAGE_KEYS.exams, []);
if (!isValidExamList(exams)) exams = [];
let goals = loadGoals();
let targetProfile = readStorage(STORAGE_KEYS.targetProfile, null);
if (!isValidTargetProfile(targetProfile)) targetProfile = null;
let customResources = readStorage(STORAGE_KEYS.resources, []);
if (!isValidResourceList(customResources)) customResources = [];

function formatNumber(value) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function initializeDate() {
  const today = new Date();
  $("#today-label").textContent = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).format(today);
  $("#exam-date").value = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
}

function renderNotes() {
  const notes = readStorage(STORAGE_KEYS.notes, "");
  $("#notes-input").value = typeof notes === "string" ? notes : "";
  updateNotesCount();
}

function updateNotesCount() {
  const length = $("#notes-input").value.length;
  $("#notes-count").textContent = `${length} karakter`;
}

function renderTasks() {
  const list = $("#task-list");
  list.replaceChildren();
  $("#tasks-empty").hidden = tasks.length > 0;
  const completed = tasks.filter((task) => task.completed).length;
  $("#task-progress").textContent = tasks.length ? `${completed}/${tasks.length} görev tamamlandı` : "Bugünün hedeflerini belirle";

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const toggle = document.createElement("button");
    toggle.className = "task-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", task.completed ? "Görevi tamamlanmadı olarak işaretle" : "Görevi tamamlandı olarak işaretle");
    toggle.setAttribute("aria-pressed", String(task.completed));
    toggle.textContent = task.completed ? "✓" : "";
    toggle.addEventListener("click", () => {
      tasks = tasks.map((entry) => entry.id === task.id ? { ...entry, completed: !entry.completed } : entry);
      writeStorage(STORAGE_KEYS.tasks, tasks);
      renderTasks();
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.setAttribute("aria-label", "Görevi sil");
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      tasks = tasks.filter((entry) => entry.id !== task.id);
      writeStorage(STORAGE_KEYS.tasks, tasks);
      renderTasks();
    });

    item.append(toggle, text, remove);
    list.append(item);
  });
}

function renderExams() {
  const body = $("#exam-table-body");
  body.replaceChildren();
  const filter = $("#exam-filter").value;
  const visibleExams = exams
    .filter((exam) => filter === "all" || exam.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  visibleExams.forEach((exam) => {
    const row = document.createElement("tr");
    const typeCell = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = `exam-pill ${exam.type.toLowerCase()}-pill`;
    pill.textContent = exam.type;
    typeCell.append(pill);

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(exam.date);

    const netCell = document.createElement("td");
    netCell.className = "net-cell";
    netCell.textContent = formatNumber(exam.net);

    const actionCell = document.createElement("td");
    const remove = document.createElement("button");
    remove.className = "delete-button row-delete";
    remove.type = "button";
    remove.setAttribute("aria-label", `${exam.type} denemesini sil`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      exams = exams.filter((entry) => entry.id !== exam.id);
      writeStorage(STORAGE_KEYS.exams, exams);
      renderExams();
      renderStatistics();
    });
    actionCell.append(remove);
    row.append(typeCell, dateCell, netCell, actionCell);
    body.append(row);
  });

  $("#record-count").textContent = String(exams.length);
  $("#exams-empty").classList.toggle("visible", visibleExams.length === 0);
  $("#exam-table-body").parentElement.hidden = visibleExams.length === 0;
}

function renderGoal(type) {
  const best = exams.filter((exam) => exam.type === type).reduce((max, exam) => Math.max(max, exam.net), 0);
  const target = goals[type];
  const percent = Math.min(100, Math.round((best / target) * 100));
  const prefix = type.toLowerCase();
  $(`#${prefix}-best`).textContent = formatNumber(best);
  $(`#${prefix}-target-label`).textContent = formatNumber(target);
  $(`#${prefix}-progress`).style.width = `${percent}%`;
  $(`#${prefix}-percent`).textContent = `${percent}%`;
}

function renderStatistics() {
  const average = exams.length ? exams.reduce((sum, exam) => sum + exam.net, 0) / exams.length : 0;
  $("#average-net").textContent = formatNumber(average);
  $("#average-detail").textContent = exams.length ? `${exams.length} deneme üzerinden` : "Henüz veri yok";
  renderGoal("TYT");
  renderGoal("AYT");
}

function renderTargetProfile() {
  const form = $("#target-form");
  const summary = $("#target-summary");
  const editButton = $("#target-edit-button");
  form.hidden = Boolean(targetProfile);
  summary.hidden = !targetProfile;
  editButton.hidden = !targetProfile;

  if (!targetProfile) return;

  $("#target-university-value").textContent = targetProfile.university;
  $("#target-department-value").textContent = targetProfile.department;
  $("#target-net-value").textContent = formatNumber(targetProfile.net);
  $("#target-quote-value").textContent = targetProfile.quote;
}

function createResourceCard(resource, removable = false) {
  const card = document.createElement("article");
  card.className = "resource-card";

  const subject = document.createElement("span");
  subject.className = "resource-subject-label";
  subject.textContent = resource.subject;

  const name = document.createElement("h3");
  name.textContent = resource.name;

  const description = document.createElement("p");
  description.textContent = resource.description;

  const actions = document.createElement("div");
  actions.className = "resource-card-actions";

  const link = document.createElement("a");
  link.className = "resource-link";
  link.href = resource.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = removable ? "Kanalı ziyaret et" : "YouTube'da bul";
  link.setAttribute("aria-label", removable
    ? `${resource.name} kanalını yeni sekmede aç`
    : `${resource.name} kaynağını YouTube'da ara`);
  actions.append(link);

  if (removable) {
    const remove = document.createElement("button");
    remove.className = "resource-delete-button";
    remove.type = "button";
    remove.textContent = "Sil";
    remove.setAttribute("aria-label", `${resource.name} kaynağını sil`);
    remove.addEventListener("click", () => {
      customResources = customResources.filter((item) => item.id !== resource.id);
      if (writeStorage(STORAGE_KEYS.resources, customResources)) renderCustomResources();
    });
    actions.append(remove);
  }

  card.append(subject, name, description, actions);
  return card;
}

function renderRecommendedResources(subject) {
  const container = $("#recommended-resources");
  container.replaceChildren();

  (RECOMMENDED_RESOURCES[subject] || []).forEach((resource) => {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(resource.query)}`;
    container.append(createResourceCard({
      subject,
      name: resource.name,
      description: resource.description,
      url: searchUrl
    }));
  });
}

function renderCustomResources() {
  const container = $("#custom-resources");
  container.replaceChildren();
  $("#resource-count").textContent = String(customResources.length);
  $("#custom-resources-empty").hidden = customResources.length > 0;

  customResources
    .slice()
    .sort((a, b) => a.subject.localeCompare(b.subject, "tr") || a.name.localeCompare(b.name, "tr"))
    .forEach((resource) => container.append(createResourceCard(resource, true)));
}

function setupResourceManager() {
  const subjectTabs = Array.from(document.querySelectorAll(".subject-tab"));
  subjectTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      subjectTabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
        item.tabIndex = isActive ? 0 : -1;
      });
      $("#recommended-resources").setAttribute("aria-labelledby", tab.id);
      renderRecommendedResources(tab.dataset.subjectFilter);
    });

    tab.addEventListener("keydown", (event) => {
      let nextIndex;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % subjectTabs.length;
      else if (event.key === "ArrowLeft") nextIndex = (index - 1 + subjectTabs.length) % subjectTabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = subjectTabs.length - 1;
      else return;

      event.preventDefault();
      subjectTabs[nextIndex].click();
      subjectTabs[nextIndex].focus();
    });
  });

  $("#resource-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const url = $("#resource-url").value.trim();
    if (!isSafeResourceUrl(url)) {
      window.alert("Lütfen http:// veya https:// ile başlayan geçerli bir kanal bağlantısı girin.");
      $("#resource-url").focus();
      return;
    }

    const resource = {
      id: crypto.randomUUID(),
      subject: $("#resource-subject").value,
      name: $("#resource-name").value.trim(),
      description: $("#resource-description").value.trim(),
      url
    };
    const updatedResources = [...customResources, resource];
    if (!writeStorage(STORAGE_KEYS.resources, updatedResources)) return;

    customResources = updatedResources;
    renderCustomResources();
    event.currentTarget.reset();
    $("#resource-name").focus();
  });

  renderRecommendedResources("Matematik");
  renderCustomResources();
}

function setupEventListeners() {
  $("#notes-input").addEventListener("input", (event) => {
    writeStorage(STORAGE_KEYS.notes, event.target.value);
    updateNotesCount();
  });

  $("#task-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#task-input");
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    tasks.unshift({ id: crypto.randomUUID(), text, completed: false });
    writeStorage(STORAGE_KEYS.tasks, tasks);
    input.value = "";
    renderTasks();
    input.focus();
  });

  $("#exam-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const type = $("#exam-type").value;
    const date = $("#exam-date").value;
    const net = Number($("#exam-net").value);
    if (!date || !Number.isFinite(net) || net < 0 || net > 300) {
      $("#exam-net").setCustomValidity("Net 0 ile 300 arasında olmalıdır.");
      $("#exam-net").reportValidity();
      return;
    }
    $("#exam-net").setCustomValidity("");
    exams.push({ id: crypto.randomUUID(), type, date, net });
    writeStorage(STORAGE_KEYS.exams, exams);
    $("#exam-net").value = "";
    renderExams();
    renderStatistics();
    $("#exam-net").focus();
  });

  $("#exam-net").addEventListener("input", (event) => event.target.setCustomValidity(""));
  $("#exam-filter").addEventListener("change", renderExams);

  $("#target-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const updatedProfile = {
      university: $("#target-university").value.trim(),
      department: $("#target-department").value.trim(),
      net: Number($("#target-net").value),
      quote: $("#target-quote").value.trim()
    };

    if (!isValidTargetProfile(updatedProfile)) {
      window.alert("Üniversite, bölüm, motivasyon sözü ve 0-300 arasındaki hedef net alanlarını kontrol edin.");
      return;
    }

    if (!writeStorage(STORAGE_KEYS.targetProfile, updatedProfile)) return;
    targetProfile = updatedProfile;
    renderTargetProfile();
  });

  $("#target-edit-button").addEventListener("click", () => {
    $("#target-university").value = targetProfile.university;
    $("#target-department").value = targetProfile.department;
    $("#target-net").value = targetProfile.net;
    $("#target-quote").value = targetProfile.quote;
    $("#target-summary").hidden = true;
    $("#target-form").hidden = false;
    $("#target-edit-button").hidden = true;
    $("#target-university").focus();
  });

  $("#goal-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const tyt = Number($("#tyt-target").value);
    const ayt = Number($("#ayt-target").value);
    if (!Number.isFinite(tyt) || !Number.isFinite(ayt) || tyt <= 0 || ayt <= 0 || tyt > 300 || ayt > 300) {
      window.alert("Hedefler 0'dan büyük ve en fazla 300 olmalıdır.");
      return;
    }
    goals = { TYT: tyt, AYT: ayt };
    writeStorage(STORAGE_KEYS.goals, goals);
    renderStatistics();
  });
}

function activateView(view, focusTab = false) {
  const tabs = Array.from(document.querySelectorAll(".page-nav-button"));
  const selectedTab = tabs.find((tab) => tab.dataset.view === view);
  if (!selectedTab) return;

  const main = document.querySelector("main");
  if (main.dataset.activeView === view) {
    if (focusTab) selectedTab.focus();
    return;
  }
  const animatedSections = [
    $("#target-card"),
    $("#welcome-section"),
    $("#exams-panel"),
    $("#resources-panel"),
    $(".right-column"),
    $(".left-column")
  ];
  animatedSections.forEach((section) => {
    const previousHandler = viewAnimationHandlers.get(section);
    if (previousHandler) section.removeEventListener("animationend", previousHandler);
    viewAnimationHandlers.delete(section);
    section.classList.remove("view-entering");
  });

  main.dataset.activeView = view;
  main.querySelectorAll("[data-view]").forEach((section) => {
    section.hidden = section.dataset.view !== view;
  });
  $(".left-column").hidden = view !== "workspace";

  const visibleSections = animatedSections.filter((section) => !section.hidden);
  if (visibleSections.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    void visibleSections[0].offsetWidth;
    visibleSections.forEach((section) => {
      const handleAnimationEnd = () => {
        section.classList.remove("view-entering");
        viewAnimationHandlers.delete(section);
      };
      viewAnimationHandlers.set(section, handleAnimationEnd);
      section.addEventListener("animationend", handleAnimationEnd, { once: true });
      section.classList.add("view-entering");
    });
  }

  tabs.forEach((tab) => {
    const isActive = tab === selectedTab;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  if (focusTab) selectedTab.focus();
}

function setupNavigation() {
  const tabs = Array.from(document.querySelectorAll(".page-nav-button"));
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateView(tab.dataset.view));
    tab.addEventListener("keydown", (event) => {
      let nextIndex;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;

      event.preventDefault();
      activateView(tabs[nextIndex].dataset.view, true);
    });
  });
}

function initialize() {
  setupResourceManager();
  setupNavigation();
  activateView("overview");
  initializeDate();
  $("#tyt-target").value = goals.TYT;
  $("#ayt-target").value = goals.AYT;
  renderTargetProfile();
  renderNotes();
  renderTasks();
  renderExams();
  renderStatistics();
  setupEventListeners();
}

initialize();
