"use strict";

(() => {
  const apiBase = document.querySelector('meta[name="api-base-url"]').content.replace(/\/+$/, "");
  const tokenKey = "hedef-yks-auth-token";
  const loginView = document.getElementById("login-view");
  const dashboardView = document.getElementById("dashboard-view");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const globalNotice = document.getElementById("global-notice");
  const incidentList = document.getElementById("incident-list");
  let incidents = [];
  let selectedIncidentId = null;
  let refreshTimer;

  function showNotice(message, isError) {
    globalNotice.textContent = message;
    globalNotice.className = isError ? "notice notice-error" : "notice";
    globalNotice.hidden = false;
  }

  function token() {
    try {
      return localStorage.getItem(tokenKey);
    } catch {
      return null;
    }
  }

  async function api(path, options = {}) {
    const response = await fetch(`${apiBase}/api/sentinel${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || `İstek başarısız oldu (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function showLogin(message) {
    clearInterval(refreshTimer);
    dashboardView.hidden = true;
    loginView.hidden = false;
    document.getElementById("logout-button").hidden = !token();
    if (message) {
      loginError.textContent = message;
      loginError.hidden = false;
    }
  }

  function showDashboard() {
    loginView.hidden = true;
    dashboardView.hidden = false;
    document.getElementById("logout-button").hidden = false;
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Bilinmeyen zaman" : new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium", timeStyle: "short",
    }).format(date);
  }

  function statusLabel(status) {
    const labels = {
      received: "İşleniyor", draft: "İnceleme bekliyor", ai_failed: "AI taslağı yok",
      approved: "PR açıldı", applied: "Uygulandı", rejected: "Reddedildi", rolled_back: "Geri alma PR'ı",
    };
    return labels[status] || status;
  }

  function renderIncidents() {
    incidentList.replaceChildren();
    document.getElementById("incident-count").textContent = `${incidents.length} olay`;
    if (!incidents.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Henüz hata raporu alınmadı.";
      incidentList.append(empty);
      return;
    }

    for (const incident of incidents) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `incident-item${incident.id === selectedIncidentId ? " is-selected" : ""}`;
      const top = document.createElement("span");
      top.className = "incident-top";
      const type = document.createElement("span");
      type.className = "muted small";
      type.textContent = incident.type.toUpperCase();
      const status = document.createElement("span");
      status.className = `status-tag status-${incident.status}`;
      status.textContent = statusLabel(incident.status);
      const message = document.createElement("span");
      message.className = "incident-message";
      message.textContent = incident.message;
      const foot = document.createElement("span");
      foot.className = "incident-foot";
      const location = document.createElement("span");
      location.textContent = incident.source_file
        ? `${incident.source_file}${incident.source_line ? `:${incident.source_line}` : ""}`
        : "Kaynak eşleşmedi";
      const time = document.createElement("span");
      time.textContent = formatDate(incident.occurred_at);
      top.append(type, status);
      foot.append(location, time);
      button.append(top, message, foot);
      button.addEventListener("click", () => selectIncident(incident.id));
      incidentList.append(button);
    }
  }

  function selectIncident(id) {
    selectedIncidentId = id;
    renderIncidents();
    const incident = incidents.find((item) => item.id === id);
    if (!incident) return;
    document.getElementById("empty-review").hidden = true;
    document.getElementById("review-content").hidden = false;
    document.getElementById("review-title").textContent = incident.message;
    const status = document.getElementById("review-status");
    status.className = `status-tag status-${incident.status}`;
    status.textContent = statusLabel(incident.status);
    const audit = incident.applied_by ? ` · Uygulayan: ${incident.applied_by}` :
      incident.reviewed_by ? ` · İnceleyen: ${incident.reviewed_by}` : "";
    document.getElementById("review-location").textContent =
      `${incident.source_file || "Kaynak bulunamadı"}${incident.source_line ? `:${incident.source_line}` : ""} · ${formatDate(incident.occurred_at)} · ${incident.page_url}${audit}`;
    const reviewLinks = document.getElementById("review-links");
    reviewLinks.replaceChildren();
    const links = [
      [incident.github_pr_url, "GitHub inceleme PR'ını aç"],
      [incident.github_rollback_pr_url, "GitHub geri alma PR'ını aç"],
    ].filter(([href]) => typeof href === "string" && href.startsWith("https://github.com/"));
    for (const [href, label] of links) {
      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = label;
      reviewLinks.append(link);
    }
    reviewLinks.hidden = links.length === 0;
    document.getElementById("review-error").hidden = !incident.error_detail;
    document.getElementById("review-error").textContent = incident.error_detail || "";
    renderDiff(incident.patch || "");
    const reviewActions = document.getElementById("review-actions");
    reviewActions.hidden = incident.status !== "draft";
    document.getElementById("approve-button").disabled = !incident.patch;
  }

  function renderDiff(patch) {
    const viewer = document.getElementById("diff-viewer");
    viewer.replaceChildren();
    if (!patch) {
      const empty = document.createElement("div");
      empty.className = "diff-line diff-context";
      empty.textContent = "Bu olay için incelenebilir bir AI yaması yok.";
      viewer.append(empty);
      return;
    }
    for (const line of patch.split("\n")) {
      if (!line) continue;
      const row = document.createElement("span");
      row.className = `diff-line ${line.startsWith("+") && !line.startsWith("+++") ? "diff-add" :
        line.startsWith("-") && !line.startsWith("---") ? "diff-remove" :
          line.startsWith("@@") ? "diff-hunk" : "diff-context"}`;
      row.textContent = line;
      viewer.append(row);
    }
  }

  async function refresh() {
    try {
      const [summary, response, config] = await Promise.all([
        api("/admin/summary"),
        api("/admin/incidents?limit=100"),
        api("/admin/config"),
      ]);
      showDashboard();
      const healthState = document.getElementById("health-state");
      const healthyDot = document.createElement("span");
      healthyDot.className = "status-dot";
      healthState.replaceChildren(healthyDot, document.createTextNode(" Sağlıklı"));
      document.getElementById("health-detail").textContent = config.modelConfigured
        ? "API bağlantısı ve AI sağlayıcısı hazır"
        : "API hazır · AI sağlayıcısı yapılandırılmamış";
      document.getElementById("total-count").textContent = summary.total;
      document.getElementById("applied-count").textContent = summary.pull_requests;
      document.getElementById("draft-count").textContent = summary.drafts;
      incidents = response.incidents;
      renderIncidents();
      if (selectedIncidentId && incidents.some((incident) => incident.id === selectedIncidentId)) {
        selectIncident(selectedIncidentId);
      } else if (selectedIncidentId) {
        selectedIncidentId = null;
        document.getElementById("empty-review").hidden = false;
        document.getElementById("review-content").hidden = true;
      }
      globalNotice.hidden = true;
      if (!config.modelConfigured || !config.githubConfigured) {
        const missing = [];
        if (!config.modelConfigured) missing.push("SENTINEL_LLM_ENDPOINT, SENTINEL_LLM_API_KEY ve SENTINEL_LLM_MODEL");
        if (!config.githubConfigured) missing.push("SENTINEL_GITHUB_TOKEN ve SENTINEL_GITHUB_REPOSITORY");
        showNotice(`Sentinel iş akışı henüz tam yapılandırılmadı: Render ortamında ${missing.join("; ")} ayarlanmalı.`, false);
      }
    } catch (error) {
      if (error.status === 401) return showLogin("Oturum süresi dolmuş. Lütfen yeniden giriş yapın.");
      if (error.status === 403) {
        showDashboard();
        showNotice("Bu hesap Sentinel yöneticisi değil. SENTINEL_ADMIN_USERNAME yapılandırmasını kontrol edin.", true);
        document.getElementById("health-state").textContent = "Erişim yok";
        document.getElementById("health-detail").textContent = "Yönetici hesabı gerekli";
        return;
      }
      showDashboard();
      document.getElementById("health-state").textContent = "Bağlantı hatası";
      document.getElementById("health-detail").textContent = "API veya PostgreSQL yanıt vermedi";
      showNotice(error.message, true);
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.hidden = true;
    const formData = new FormData(loginForm);
    try {
      const response = await fetch(`${apiBase}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formData.get("username"), password: formData.get("password") }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Giriş başarısız.");
      localStorage.setItem(tokenKey, data.token);
      loginForm.reset();
      await refresh();
    } catch (error) {
      loginError.textContent = error.message;
      loginError.hidden = false;
    }
  });

  document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem(tokenKey);
    showLogin();
  });
  document.getElementById("refresh-button").addEventListener("click", refresh);

  document.getElementById("reject-button").addEventListener("click", async () => {
    if (!selectedIncidentId || !window.confirm("Bu AI taslağını reddedip kapatmak istiyor musunuz?")) return;
    try {
      await api(`/admin/incidents/${encodeURIComponent(selectedIncidentId)}/reject`, { method: "POST", body: "{}" });
      await refresh();
    } catch (error) {
      showNotice(error.message, true);
    }
  });

  document.getElementById("approve-button").addEventListener("click", async () => {
    if (!selectedIncidentId || !window.confirm("Bu yamayı ayrı bir GitHub dalına gönderip taslak PR oluşturmayı onaylıyor musunuz? Kod, PR ayrıca birleştirilmeden canlıya çıkmaz.")) return;
    try {
      const result = await api(`/admin/incidents/${encodeURIComponent(selectedIncidentId)}/approve`, { method: "POST", body: "{}" });
      showNotice(`Taslak PR oluşturuldu: ${result.pullRequestUrl}`, false);
      await refresh();
    } catch (error) {
      showNotice(error.message, true);
    }
  });

  document.getElementById("rollback-button").addEventListener("click", async () => {
    if (!window.confirm("Son birleştirilmiş Sentinel PR'ı için GitHub'da taslak geri alma PR'ı oluşturulsun mu?")) return;
    try {
      const result = await api("/admin/rollback", { method: "POST", body: "{}" });
      showNotice(`Taslak geri alma PR'ı oluşturuldu: ${result.rollbackPullRequestUrl}`, false);
      await refresh();
    } catch (error) {
      showNotice(error.message, true);
    }
  });

  if (!token()) showLogin();
  else void refresh();
  refreshTimer = window.setInterval(() => {
    if (token() && !dashboardView.hidden) void refresh();
  }, 30_000);
})();
