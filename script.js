"use strict";

const STORAGE_KEYS = {
  notes: "odak-yks-notes",
  tasks: "odak-yks-tasks",
  exams: "odak-yks-exams",
  calculatedExams: "odak-yks-calculated-exams",
  goals: "odak-yks-goals",
  targetProfile: "odak-yks-target-profile",
  resources: "odak-yks-resources",
  questionLogs: "odak-yks-question-logs",
  theme: "odak-yks-theme",
  topicProgress: "odak-yks-topic-progress"
};
const AUTH_TOKEN_KEY = "hedef-yks-auth-token";
const AUTH_API_URL = document.querySelector('meta[name="api-base-url"]').content.replace(/\/+$/, "");

const DEFAULT_GOALS = { TYT: 100, AYT: 70 };
const NET_SUBJECTS = [
  { id: "turkish", label: "Türkçe" },
  { id: "social", label: "Sosyal" },
  { id: "math", label: "Matematik" },
  { id: "science", label: "Fen" }
];
const TOPIC_CURRICULUM = {
  TYT: [
    { id: "turkish", name: "Türkçe", topics: [
      "Sözcükte Anlam", "Cümlede Anlam", "Paragraf ve Anlam Bilgisi", "Ses Bilgisi",
      "Yazım Kuralları", "Noktalama İşaretleri", "Sözcüğün Yapısı / Ekler",
      "İsimler, Sıfatlar, Zamirler, Zarflar", "Edat, Bağlaç, Ünlem", "Fiiller ve Fiilimsiler",
      "Cümlenin Ögeleri ve Cümle Türleri", "Anlatım Bozuklukları"
    ] },
    { id: "math", name: "Matematik", topics: [
      "Temel Kavramlar ve Sayılar", "Bölünebilme Kuralları", "EBOB - EKOK", "Rasyonel Sayılar",
      "Basit Eşitsizlikler", "Mutlak Değer", "Üslü Sayılar", "Köklü Sayılar",
      "Çarpanlara Ayırma ve Oran-Orantı", "Denklem Çözme",
      "Problemler (Sayı, Kesir, Yaş, İşçi, Havuz, Yüzde, Kâr-Zarar, Karışım, Hız, Grafik)",
      "Kümeler ve Mantık", "Fonksiyonlar", "Polinomlar ve Çarpanlara Ayırma",
      "Permütasyon - Kombinasyon - Binom - Olasılık", "İstatistik"
    ] },
    { id: "geometry", name: "Geometri", topics: [
      "Doğruda ve Üçgende Açılar", "Özel Üçgenler (İkizkenar, Eşkenar, Dik)",
      "Üçgende Kenarortay, Açıortay ve Benzerlik", "Üçgende Alan",
      "Çokgenler ve Dörtgenler (Yamuk, Paralelkenar, Eşkenar Dörtgen, Deltoid, Dikdörtgen, Kare)",
      "Çember ve Daire", "Katı Cisimler (Prizma, Silindir, Koni, Küre)", "Analitik Geometri"
    ] },
    { id: "history", name: "Tarih", topics: [
      "Tarih ve Zaman", "İlk ve Çağlarda Türk Dünyası", "İslam Tarihi ve Uygarlığı",
      "Türk - İslam Devletleri (10-13. Yüzyıllar)", "Türkiye Tarihi (Selçuklular ve Beylikler)",
      "Beylikten Devlete Osmanlı Siyaseti (1300-1453)", "Dünya Gücü Osmanlı (1453-1600)",
      "Osmanlı Devleti'nde Arayış Yılları (17. Yüzyıl)", "18. Yüzyılda Değişim ve Diplomasi",
      "En Uzun Yüzyıl (19. Yüzyıl)", "20. Yüzyılda Osmanlı Devleti (I. Dünya Savaşı)",
      "Kurtuluş Savaşı'na Hazırlık Dönemi", "Kurtuluş Savaşı ve Antlaşmalar",
      "Atatürkçülük ve Türk İnkılabı"
    ] },
    { id: "geography", name: "Coğrafya", topics: [
      "Doğa ve İnsan / Coğrafyanın Konusu", "Dünya'nın Şekli ve Hareketleri", "Coğrafi Konum",
      "Harita Bilgisi", "Atmosfer ve İklim", "Yer'in Şekli ve İç Kuvvetler / Dış Kuvvetler",
      "Su, Toprak ve Bitki Varlığı", "Nüfus ve Yerleşme", "Göç ve Şehirleşme",
      "Türkiye'nin Yerşekilleri ve İklimi", "Ekonomik Faaliyetler ve Ulaşım", "Afetler ve Çevre"
    ] },
    { id: "philosophy", name: "Felsefe", topics: [
      "Felsefenin Konusu ve Alanı", "Bilgi Felsefesi (Epistemoloji)", "Varlık Felsefesi (Ontoloji)",
      "Ahlak Felsefesi (Etik)", "Din, Sanat ve Siyaset Felsefesi", "Bilim Felsefesi"
    ] },
    { id: "religion", name: "Din Kültürü", topics: [
      "Bilgi ve İnanç", "İbadetler", "Hz. Muhammed'in Hayatı ve Örnekliği", "Vahiy ve Akıl",
      "İslam Düşüncesinde Yorumlar ve Mezhepler", "Din, Kültür ve Medeniyet / Ahlaki Değerler"
    ] },
    { id: "physics", name: "Fizik", topics: [
      "Fizik Bilimine Giriş", "Madde ve Özellikleri", "Hareket ve Kuvvet", "İş, Güç ve Enerji",
      "Isı, Sıcaklık ve Genleşme", "Elektromanyetizma ve Elektrik Akımı",
      "Basınç ve Kaldırma Kuvveti", "Dalgalar", "Optik (Işık ve Yansıma)"
    ] },
    { id: "chemistry", name: "Kimya", topics: [
      "Kimya Bilimi (Simyadan Kimyaya)", "Atom ve Periyodik Sistem",
      "Kimyasal Türler Arası Etkileşimler", "Maddenin Halleri (Katı, Sıvı, Gaz)",
      "Doğa ve Kimya / Çevre Kimyası", "Kimyanın Temel Kanunları", "Mol Kavramı",
      "Kimyasal Hesaplamalar", "Karışımlar", "Asitler, Bazlar ve Tuzlar", "Kimya Her Yerde"
    ] },
    { id: "biology", name: "Biyoloji", topics: [
      "Yaşamın Bilimi Biyoloji (Canlıların Ortak Özellikleri)",
      "Canlıların Temel Bileşenleri (İnorganik ve Organik)",
      "Hücre ve Organelleri / Madde Geçişleri", "Canlıların Sınıflandırılması",
      "Hücre Bölünmeleri (Mitoz ve Mayoz)", "Kalıtımın Genel İlkeleri",
      "Ekoloji (Ekosistem Ekolojisi ve Güncel Çevre Sorunları)"
    ] }
  ],
  AYT: [
    { id: "math", name: "Matematik", topics: [
      "Polinomlar, Çarpanlara Ayırma ve İkinci Dereceden Denklemler",
      "Karmaşık Sayılar ve Eşitsizlikler", "Parabol", "Trigonometri 1 ve 2", "Logaritma",
      "Diziler", "Limit ve Süreklilik", "Türev ve Uygulamaları", "İntegral ve Uygulamaları"
    ] },
    { id: "physics", name: "Fizik", topics: [
      "Vektörler ve Bağıl Hareket", "Newton'un Hareket Yasaları",
      "Bir Boyutta ve İki Boyutta Sabit İvmeli Hareket",
      "İş, Güç, Enerji ve İtme-Çizgisel Momentum", "Tork, Denge ve Ağırlık Merkezi",
      "Basit Makineler ve Elektrik Alan - Potansiyel", "Manyetizma ve İndüksiyon",
      "Alternatif Akım ve Transformatörler",
      "Çembersel Hareket ve Basit Harmonik Hareket", "Dalga Mekaniği ve Optik Olaylar",
      "Atom Modelleri, Radyoaktivite ve Modern Fizik"
    ] },
    { id: "chemistry", name: "Kimya", topics: [
      "Modern Atom Teorisi", "Gazlar", "Sıvı Çözeltiler ve Koligatif Özellikler",
      "Kimyasal Tepkimelerde Enerji", "Kimyasal Tepkimelerde Hız",
      "Kimyasal Tepkimelerde Denge", "Sulu Çözelti Dengeleri (Asit-Baz, Tampon, Çözünürlük)",
      "Kimya ve Elektrik (Piller, Elektroliz)",
      "Karbon Kimyasına Giriş / Organik Kimya (Hidrokarbonlar, Fonksiyonel Gruplar)",
      "Enerji Kaynakları ve Bilimsel Gelişmeler"
    ] },
    { id: "biology", name: "Biyoloji", topics: [
      "Sinir Sistemi ve Endokrin Sistem", "Duyu Organları", "Destek ve Hareket Sistemi",
      "Sindirim, Dolaşım ve Solunum Sistemi", "Üriner Sistem (Boşaltım Sistemi)",
      "Üreme Sistemi ve Embriyonik Gelişim", "Komünite ve Popülasyon Ekolojisi",
      "Genden Proteine (DNA, RNA, Protein Sentezi)", "Fotosentez ve Kemosentez",
      "Hücresel Solunum ve Fermentasyon", "Bitki Biyolojisi (Kök, Gövde, Yaprak, Üreme)",
      "Canlılar ve Çevre / Evrim Tartışmaları"
    ] }
  ]
};
const TOPIC_IDS = new Set(Object.entries(TOPIC_CURRICULUM).flatMap(([exam, subjects]) =>
  subjects.flatMap((subject) => subject.topics.map((_, index) => `${exam}:${subject.id}:${index}`))
));
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

function isValidCalculatedExamList(value) {
  return Array.isArray(value) && value.every((exam) =>
    exam && typeof exam.id === "string" &&
    (exam.type === "TYT" || exam.type === "AYT") &&
    typeof exam.date === "string" &&
    exam.subjects && NET_SUBJECTS.every(({ id }) => {
      const subject = exam.subjects[id];
      return subject && Number.isInteger(subject.correct) && subject.correct >= 0 &&
        Number.isInteger(subject.wrong) && subject.wrong >= 0 &&
        Number.isFinite(subject.net) &&
        Math.abs(subject.net - (subject.correct - subject.wrong / 4)) < 0.001;
    }) &&
    Number.isFinite(exam.totalNet) &&
    Math.abs(exam.totalNet - NET_SUBJECTS.reduce((sum, { id }) => sum + exam.subjects[id].net, 0)) < 0.001
  );
}

function isValidQuestionLogList(value) {
  return Array.isArray(value) && value.every((entry) =>
    entry && typeof entry.id === "string" &&
    typeof entry.date === "string" &&
    isValidDateString(entry.date) &&
    Number.isSafeInteger(entry.count) && entry.count >= 0
  );
}

function isValidTopicProgress(value) {
  return Array.isArray(value) && value.every((topicId) =>
    typeof topicId === "string" && TOPIC_IDS.has(topicId)
  );
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
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
let calculatedExams = readStorage(STORAGE_KEYS.calculatedExams, []);
if (!isValidCalculatedExamList(calculatedExams)) calculatedExams = [];
let goals = loadGoals();
let targetProfile = readStorage(STORAGE_KEYS.targetProfile, null);
if (!isValidTargetProfile(targetProfile)) targetProfile = null;
let customResources = readStorage(STORAGE_KEYS.resources, []);
if (!isValidResourceList(customResources)) customResources = [];
let questionLogs = readStorage(STORAGE_KEYS.questionLogs, []);
if (!isValidQuestionLogList(questionLogs)) questionLogs = [];
let completedTopics = readStorage(STORAGE_KEYS.topicProgress, []);
if (!isValidTopicProgress(completedTopics)) completedTopics = [];

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
  $("#net-exam-date").value = $("#exam-date").value;
  $("#question-date").value = $("#exam-date").value;
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

function renderCalculatedExamHistory() {
  const body = $("#net-history-body");
  body.replaceChildren();

  const sortedExams = calculatedExams
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  sortedExams.forEach((exam) => {
    const row = document.createElement("tr");
    const examCell = document.createElement("td");
    examCell.className = "net-history-exam-cell";
    const examType = document.createElement("span");
    examType.className = `exam-pill ${exam.type.toLowerCase()}-pill`;
    examType.textContent = exam.type;
    const examDate = document.createElement("span");
    examDate.textContent = formatDate(exam.date);
    examCell.append(examType, examDate);
    row.append(examCell);

    NET_SUBJECTS.forEach(({ id }) => {
      const cell = document.createElement("td");
      cell.textContent = formatNumber(exam.subjects[id].net);
      row.append(cell);
    });

    const totalCell = document.createElement("td");
    totalCell.className = "net-history-total";
    totalCell.textContent = formatNumber(exam.totalNet);
    row.append(totalCell);

    const actionCell = document.createElement("td");
    const removeButton = document.createElement("button");
    removeButton.className = "delete-button row-delete";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `${exam.type} ${formatDate(exam.date)} net hesabını sil`);
    removeButton.addEventListener("click", () => {
      const updatedExams = calculatedExams.filter((entry) => entry.id !== exam.id);
      if (!writeStorage(STORAGE_KEYS.calculatedExams, updatedExams)) return;
      calculatedExams = updatedExams;
      renderCalculatedExamHistory();
    });
    actionCell.append(removeButton);
    row.append(actionCell);
    body.append(row);
  });

  $("#net-history-count").textContent = String(calculatedExams.length);
  $("#net-history-empty").hidden = calculatedExams.length > 0;
  $(".net-history-table").hidden = calculatedExams.length === 0;
}

function renderQuestionHistory() {
  const list = $("#question-history-list");
  list.replaceChildren();

  const sortedLogs = questionLogs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  sortedLogs.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "question-history-item";

    const dateIcon = document.createElement("span");
    dateIcon.className = "question-date-icon";
    dateIcon.setAttribute("aria-hidden", "true");
    dateIcon.textContent = "◷";

    const date = document.createElement("time");
    date.className = "question-history-date";
    date.dateTime = entry.date;
    date.textContent = formatDate(entry.date);

    const count = document.createElement("strong");
    count.className = "question-history-count";
    count.textContent = `${formatNumber(entry.count)} soru`;

    const removeButton = document.createElement("button");
    removeButton.className = "question-delete-button";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `${formatDate(entry.date)} tarihli ${entry.count} soruluk kaydı sil`);
    removeButton.addEventListener("click", () => {
      const updatedLogs = questionLogs.filter((log) => log.id !== entry.id);
      if (!writeStorage(STORAGE_KEYS.questionLogs, updatedLogs)) return;
      questionLogs = updatedLogs;
      renderQuestionHistory();
    });

    item.append(dateIcon, date, count, removeButton);
    list.append(item);
  });

  const total = questionLogs.reduce((sum, entry) => sum + entry.count, 0);
  $("#question-total").textContent = formatNumber(total);
  $("#question-record-count").textContent = String(questionLogs.length);
  $("#question-history-empty").hidden = questionLogs.length > 0;
  list.hidden = questionLogs.length === 0;
}

function setupQuestionTracker() {
  $("#question-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const date = $("#question-date").value;
    const count = Number($("#question-count").value);
    const countInput = $("#question-count");

    if (!isValidDateString(date)) {
      window.alert("Lütfen geçerli bir tarih seçin.");
      $("#question-date").focus();
      return;
    }

    if (!Number.isSafeInteger(count) || count < 0) {
      countInput.setCustomValidity("Soru sayısı sıfır veya daha büyük bir tam sayı olmalıdır.");
      countInput.reportValidity();
      return;
    }

    countInput.setCustomValidity("");
    const updatedLogs = [...questionLogs, {
      id: crypto.randomUUID(),
      date,
      count
    }];
    if (!writeStorage(STORAGE_KEYS.questionLogs, updatedLogs)) return;

    questionLogs = updatedLogs;
    renderQuestionHistory();
    countInput.value = "";
    countInput.focus();
  });

  $("#question-count").addEventListener("input", (event) => event.target.setCustomValidity(""));
}

function updateTopicProgress(exam) {
  const subjects = TOPIC_CURRICULUM[exam];
  const topicCount = subjects.reduce((total, subject) => total + subject.topics.length, 0);
  const completed = subjects.reduce((total, subject) => total + subject.topics.filter((_, index) =>
    completedTopics.includes(`${exam}:${subject.id}:${index}`)
  ).length, 0);
  const percent = topicCount ? Math.round((completed / topicCount) * 100) : 0;
  const overallTrack = $(".topic-overall-progress .topic-progress-track");

  $("#topic-exam-label").textContent = `${exam} GENEL İLERLEME`;
  $("#topic-overall-percent").textContent = `${percent}%`;
  $("#topic-overall-count").textContent = `${completed} / ${topicCount} konu tamamlandı`;
  $("#topic-overall-bar").style.width = `${percent}%`;
  overallTrack.setAttribute("aria-valuenow", String(percent));

  subjects.forEach((subject) => {
    const subjectCompleted = subject.topics.filter((_, index) =>
      completedTopics.includes(`${exam}:${subject.id}:${index}`)
    ).length;
    const subjectPercent = subject.topics.length
      ? Math.round((subjectCompleted / subject.topics.length) * 100)
      : 0;
    const card = document.querySelector(`[data-topic-subject="${exam}:${subject.id}"]`);
    if (!card) return;
    card.querySelector(".topic-subject-percent").textContent = `${subjectPercent}%`;
    card.querySelector(".topic-subject-count").textContent = `${subjectCompleted} / ${subject.topics.length}`;
    card.querySelector(".topic-progress-fill").style.width = `${subjectPercent}%`;
    card.querySelector(".topic-progress-track").setAttribute("aria-valuenow", String(subjectPercent));
  });
}

function renderTopicSubjects(exam) {
  const container = $("#topic-subjects");
  container.replaceChildren();
  container.setAttribute("aria-labelledby", `topic-${exam.toLowerCase()}-tab`);

  TOPIC_CURRICULUM[exam].forEach((subject) => {
    const card = document.createElement("section");
    card.className = "topic-subject-card";
    card.dataset.topicSubject = `${exam}:${subject.id}`;

    const heading = document.createElement("div");
    heading.className = "topic-subject-heading";

    const title = document.createElement("h3");
    title.textContent = subject.name;

    const stats = document.createElement("div");
    stats.className = "topic-subject-stats";
    const count = document.createElement("span");
    count.className = "topic-subject-count";
    count.textContent = `0 / ${subject.topics.length}`;
    const percent = document.createElement("strong");
    percent.className = "topic-subject-percent";
    percent.textContent = "0%";
    stats.append(count, percent);
    heading.append(title, stats);

    const progressTrack = document.createElement("div");
    progressTrack.className = "topic-progress-track topic-subject-track";
    progressTrack.setAttribute("role", "progressbar");
    progressTrack.setAttribute("aria-label", `${subject.name} konu ilerlemesi`);
    progressTrack.setAttribute("aria-valuemin", "0");
    progressTrack.setAttribute("aria-valuemax", "100");
    progressTrack.setAttribute("aria-valuenow", "0");
    const progressFill = document.createElement("span");
    progressFill.className = "topic-progress-fill";
    progressTrack.append(progressFill);

    const list = document.createElement("ul");
    list.className = "topic-checklist";
    subject.topics.forEach((topic, index) => {
      const topicId = `${exam}:${subject.id}:${index}`;
      const item = document.createElement("li");
      item.className = "topic-checklist-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `topic-${exam.toLowerCase()}-${subject.id}-${index}`;
      checkbox.dataset.topicId = topicId;
      checkbox.checked = completedTopics.includes(topicId);

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = topic;
      item.append(checkbox, label);
      list.append(item);
    });

    card.append(heading, progressTrack, list);
    container.append(card);
  });

  updateTopicProgress(exam);
}

function setupTopicTracker() {
  const tabs = Array.from(document.querySelectorAll(".topic-exam-tab"));
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
        item.tabIndex = isActive ? 0 : -1;
      });
      renderTopicSubjects(tab.dataset.exam);
    });

    tab.addEventListener("keydown", (event) => {
      let nextIndex;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;

      event.preventDefault();
      tabs[nextIndex].click();
      tabs[nextIndex].focus();
    });
  });

  $("#topic-subjects").addEventListener("change", (event) => {
    const checkbox = event.target;
    if (!checkbox.matches("input[data-topic-id]")) return;

    const topicId = checkbox.dataset.topicId;
    const updatedTopics = checkbox.checked
      ? [...completedTopics, topicId]
      : completedTopics.filter((id) => id !== topicId);
    if (!writeStorage(STORAGE_KEYS.topicProgress, updatedTopics)) {
      checkbox.checked = !checkbox.checked;
      return;
    }

    completedTopics = updatedTopics;
    updateTopicProgress(checkbox.dataset.topicId.split(":")[0]);
  });

  renderTopicSubjects("TYT");
}

function renderCalculatedExamResult(exam) {
  $("#net-result-title").textContent = `${exam.type} · ${formatDate(exam.date)}`;
  $("#net-total-value").textContent = formatNumber(exam.totalNet);
  const resultGrid = $("#net-result-grid");
  resultGrid.replaceChildren();

  NET_SUBJECTS.forEach(({ id, label }) => {
    const card = document.createElement("div");
    card.className = "net-result-subject";
    const subjectName = document.createElement("span");
    subjectName.textContent = label;
    const subjectNet = document.createElement("strong");
    subjectNet.textContent = formatNumber(exam.subjects[id].net);
    card.append(subjectName, subjectNet);
    resultGrid.append(card);
  });

  $("#net-result").hidden = false;
}

function setupNetCalculator() {
  $("#net-calculator-form").addEventListener("submit", (event) => {
    event.preventDefault();

    const subjects = {};
    let answeredQuestions = 0;
    let invalidInput = null;
    NET_SUBJECTS.forEach(({ id }) => {
      const correctInput = $(`[data-subject="${id}"][data-answer="correct"]`);
      const wrongInput = $(`[data-subject="${id}"][data-answer="wrong"]`);
      const correct = Number(correctInput.value);
      const wrong = Number(wrongInput.value);
      if (!Number.isInteger(correct) || correct < 0 || !Number.isInteger(wrong) || wrong < 0) {
        invalidInput = correctInput;
        return;
      }

      answeredQuestions += correct + wrong;
      subjects[id] = { correct, wrong, net: correct - wrong / 4 };
    });

    if (invalidInput || answeredQuestions === 0) {
      window.alert(invalidInput
        ? "Doğru ve yanlış sayılarını sıfır veya daha büyük tam sayı olarak girin."
        : "Net hesaplamak için en az bir doğru veya yanlış sayısı girin.");
      (invalidInput || $("#net-turkish-correct")).focus();
      return;
    }

    const exam = {
      id: crypto.randomUUID(),
      type: $("#net-exam-type").value,
      date: $("#net-exam-date").value,
      subjects,
      totalNet: NET_SUBJECTS.reduce((sum, { id }) => sum + subjects[id].net, 0)
    };
    const updatedExams = [exam, ...calculatedExams];
    if (!writeStorage(STORAGE_KEYS.calculatedExams, updatedExams)) return;

    calculatedExams = updatedExams;
    renderCalculatedExamResult(exam);
    renderCalculatedExamHistory();
  });
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
    $("#question-tracker-panel"),
    $("#topic-tracker-panel"),
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

function setupThemeToggle() {
  const button = $("#theme-toggle");
  let theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";

  try {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (savedTheme === "light" || savedTheme === "dark") theme = savedTheme;
  } catch (error) {
    console.error("Tema tercihi okunamadı:", error);
  }

  const applyTheme = (nextTheme) => {
    theme = nextTheme;
    document.documentElement.dataset.theme = theme;
    const nextLabel = theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç";
    button.setAttribute("aria-label", nextLabel);
    button.setAttribute("title", nextLabel);
    button.setAttribute("aria-pressed", String(theme === "light"));
    document.querySelector('meta[name="theme-color"]').content = theme === "light" ? "#f2f5fc" : "#080d18";
  };

  applyTheme(theme);
  button.addEventListener("click", () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
    } catch (error) {
      console.error("Tema tercihi kaydedilemedi:", error);
      window.alert("Tema değiştirildi ancak tercihiniz tarayıcıya kaydedilemedi.");
    }
  });
}

function setupAuthentication() {
  const appShell = $("#app-shell");
  const loginScreen = $("#login-screen");
  const form = $("#login-form");
  const message = $("#login-message");
  const submitButton = $("#login-submit");
  let appInitialized = false;

  const showLogin = (errorMessage = "") => {
    appShell.hidden = true;
    loginScreen.hidden = false;
    message.textContent = errorMessage;
    $("#login-username").focus();
  };

  const showApp = () => {
    loginScreen.hidden = true;
    appShell.hidden = false;
    if (!appInitialized) {
      initialize();
      appInitialized = true;
    }
  };

  const explainConnectionError = (error) => {
    if (error instanceof TypeError) {
      return "Sunucuya bağlanılamadı. Backend'in çalıştığını ve CORS adresini kontrol edin.";
    }
    return error.message || "Giriş sırasında bir hata oluştu.";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    submitButton.disabled = true;
    submitButton.textContent = "Giriş yapılıyor...";

    try {
      const response = await fetch(`${AUTH_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.elements.username.value.trim(),
          password: form.elements.password.value
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Giriş başarısız.");
      if (typeof data.token !== "string" || !data.token) {
        throw new Error("Sunucudan geçerli bir oturum anahtarı alınamadı.");
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      form.reset();
      showApp();
    } catch (error) {
      form.elements.password.value = "";
      message.textContent = explainConnectionError(error);
      form.elements.password.focus();
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Giriş Yap";
    }
  });

  $("#auth-logout").addEventListener("click", () => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      showLogin("Oturum kapatıldı.");
    } catch (error) {
      console.error("Oturum bilgisi silinemedi:", error);
      showLogin("Oturum bilgisi silinemedi. Tarayıcı depolama ayarlarını kontrol edin.");
    }
  });

  async function restoreSession() {
    let token;
    try {
      token = localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error("Oturum bilgisi okunamadı:", error);
      showLogin("Tarayıcı oturum bilgisine erişemedi. Depolama ayarlarını kontrol edin.");
      return;
    }

    if (!token) {
      showLogin();
      return;
    }

    try {
      const response = await fetch(`${AUTH_API_URL}/api/check-auth`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        showApp();
        return;
      }
      if (response.status !== 401) {
        throw new Error("Oturum doğrulanamadı. Lütfen tekrar deneyin.");
      }

      localStorage.removeItem(AUTH_TOKEN_KEY);
      showLogin("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
    } catch (error) {
      showLogin(explainConnectionError(error));
    }
  }

  restoreSession();
}

function initialize() {
  setupThemeToggle();
  setupResourceManager();
  setupNavigation();
  setupNetCalculator();
  setupQuestionTracker();
  setupTopicTracker();
  activateView("overview");
  initializeDate();
  $("#tyt-target").value = goals.TYT;
  $("#ayt-target").value = goals.AYT;
  renderTargetProfile();
  renderNotes();
  renderTasks();
  renderExams();
  renderCalculatedExamHistory();
  renderQuestionHistory();
  renderStatistics();
  setupEventListeners();
}

setupAuthentication();
