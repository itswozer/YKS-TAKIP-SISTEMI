"use strict";

(() => {
  const apiMeta = document.querySelector('meta[name="api-base-url"]');
  if (!apiMeta || typeof window.fetch !== "function") return;

  const apiBase = apiMeta.content.replace(/\/+$/, "");
  const reportUrl = `${apiBase}/api/sentinel/report`;
  const nativeFetch = window.fetch.bind(window);
  const recentReports = new Map();
  const REPORT_WINDOW_MS = 60_000;
  const MAX_REPORTS_PER_WINDOW = 20;

  function safeUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      if (url.origin !== window.location.origin && url.origin !== new URL(apiBase).origin) return null;
      return `${url.origin}${url.pathname}`.slice(0, 1000);
    } catch {
      return null;
    }
  }

  function allowedRequestUrl(value) {
    const url = safeUrl(value);
    if (!url || url.startsWith(`${apiBase}/api/sentinel/`)) return null;
    try {
      const path = new URL(url).pathname;
      if (["/api/login", "/api/register", "/api/check-auth"].includes(path)) return null;
    } catch {
      return null;
    }
    return url;
  }

  function redact(value) {
    return String(value || "")
      .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]")
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email redacted]")
      .replace(/https?:\/\/[^\s)]+/gi, (candidate) => {
        const position = candidate.match(/(:\d+:\d+)$/);
        const address = position ? candidate.slice(0, -position[0].length) : candidate;
        try {
          const url = new URL(address);
          return `${url.origin}${url.pathname}${position ? position[0] : ""}`;
        } catch {
          return candidate;
        }
      })
      .slice(0, 2000);
  }

  function submitReport(report) {
    const now = Date.now();
    for (const [key, expiresAt] of recentReports) {
      if (expiresAt <= now) recentReports.delete(key);
    }
    if (recentReports.size >= MAX_REPORTS_PER_WINDOW) return;

    const signature = `${report.type}:${report.message}:${report.source || ""}`;
    if (recentReports.has(signature)) return;
    recentReports.set(signature, now + REPORT_WINDOW_MS);

    const payload = {
      type: report.type,
      message: redact(report.message),
      stack: redact(report.stack).slice(0, 12_000),
      pageUrl: safeUrl(window.location.href),
      source: report.source ? safeUrl(report.source) : null,
      line: Number.isInteger(report.line) && report.line > 0 ? report.line : null,
      column: Number.isInteger(report.column) && report.column > 0 ? report.column : null,
      status: Number.isInteger(report.status) ? report.status : null,
      browser: navigator.userAgent.slice(0, 300),
      timestamp: new Date().toISOString(),
    };

    nativeFetch(reportUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }

  function reportException(error, type) {
    const reason = error instanceof Error ? error : new Error(String(error || "Bilinmeyen hata"));
    submitReport({ type, message: reason.message, stack: reason.stack || "" });
  }

  window.addEventListener("error", (event) => {
    if (event instanceof ErrorEvent && (event.error || event.message)) {
      submitReport({
        type: "runtime",
        message: event.message || event.error?.message,
        stack: event.error?.stack || "",
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    }
  }, true);

  const previousOnError = window.onerror;
  window.onerror = function sentinelOnError(message, source, line, column, error) {
    submitReport({
      type: "runtime",
      message: error?.message || message,
      stack: error?.stack || "",
      source,
      line,
      column,
    });
    if (typeof previousOnError === "function") {
      return previousOnError.call(window, message, source, line, column, error);
    }
    return false;
  };

  window.addEventListener("unhandledrejection", (event) => {
    reportException(event.reason, "unhandledrejection");
  });

  window.fetch = function sentinelFetch(input, init) {
    let requestUrl = null;
    try {
      const request = typeof input === "string" || input instanceof URL ? input : input?.url;
      if (request !== null && request !== undefined) requestUrl = allowedRequestUrl(request);
    } catch {
      requestUrl = null;
    }
    return nativeFetch(input, init).then((response) => {
      if (!response.ok && requestUrl) {
        submitReport({
          type: "http",
          message: `HTTP ${response.status} isteği başarısız oldu.`,
          stack: new Error().stack || "",
          source: requestUrl,
          status: response.status,
        });
      }
      return response;
    }, (error) => {
      if (requestUrl) {
        submitReport({
          type: "network",
          message: error?.message || "Ağ isteği başarısız oldu.",
          stack: error?.stack || "",
          source: requestUrl,
        });
      }
      throw error;
    });
  };

  if (typeof XMLHttpRequest !== "undefined") {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const requestUrls = new WeakMap();

    XMLHttpRequest.prototype.open = function sentinelOpen(method, url, ...rest) {
      requestUrls.set(this, allowedRequestUrl(url));
      return originalOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function sentinelSend(...args) {
      this.addEventListener("loadend", () => {
        const requestUrl = requestUrls.get(this);
        if (requestUrl && this.status === 0) {
          submitReport({
            type: "network",
            message: "XHR/axios isteği ağ hatası nedeniyle başarısız oldu.",
            stack: new Error().stack || "",
            source: requestUrl,
          });
        } else if (requestUrl && this.status >= 400) {
          submitReport({
            type: "http",
            message: `HTTP ${this.status} isteği başarısız oldu.`,
            stack: new Error().stack || "",
            source: requestUrl,
            status: this.status,
          });
        }
      }, { once: true });
      return originalSend.apply(this, args);
    };
  }
})();
