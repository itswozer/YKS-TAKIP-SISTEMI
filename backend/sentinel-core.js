"use strict";

const SOURCE_FILES = new Set(["script.js", "sentinel.js", "service-worker.js"]);

function parseStackTarget(stack) {
  if (typeof stack !== "string") return null;
  const urlFrames = stack.match(/https?:\/\/[^\s)]+/gi) || [];
  for (const frame of urlFrames) {
    const position = frame.match(/:(\d+):(\d+)$/);
    if (!position) continue;
    const address = frame.slice(0, -position[0].length);
    let file;
    try {
      file = new URL(address).pathname.split("/").pop();
    } catch {
      continue;
    }
    const target = makeStackTarget(file, position[1], position[2]);
    if (target) return target;
  }

  const plainFrame = /(?:^|\s|@)(script\.js|sentinel\.js|service-worker\.js):(\d+):(\d+)/m.exec(stack);
  if (plainFrame) {
    return makeStackTarget(plainFrame[1], plainFrame[2], plainFrame[3]);
  }
  return null;
}

function makeStackTarget(file, lineValue, columnValue) {
  const line = Number(lineValue);
  const column = Number(columnValue);
  if (!SOURCE_FILES.has(file) || !Number.isSafeInteger(line) || line < 1 || line > 2_147_483_647 ||
      !Number.isSafeInteger(column) || column < 1 || column > 2_147_483_647) return null;
  return { file, line, column };
}

function sanitizeReport(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Hata raporu geçersiz." };
  }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  if (!message) return { error: "Hata mesajı gerekli." };

  let pageUrl = null;
  try {
    const parsedUrl = new URL(body.pageUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("unsupported URL");
    pageUrl = `${parsedUrl.origin}${parsedUrl.pathname}`.slice(0, 1000);
  } catch {
    return { error: "Sayfa adresi geçersiz." };
  }

  const timestamp = typeof body.timestamp === "string" && !Number.isNaN(Date.parse(body.timestamp))
    ? new Date(body.timestamp).toISOString()
    : new Date().toISOString();
  const allowedTypes = new Set(["runtime", "unhandledrejection", "http", "network"]);
  const type = allowedTypes.has(body.type) ? body.type : "runtime";
  const stack = typeof body.stack === "string" ? body.stack.slice(0, 12_000) : "";
  const target = parseStackTarget(stack) || parseSourceTarget(body.source, body.line, body.column);

  return {
    report: {
      type,
      message: redact(message),
      stack: redact(stack).slice(0, 12_000),
      pageUrl,
      browser: typeof body.browser === "string" ? redact(body.browser).slice(0, 300) : "",
      timestamp,
      sourceFile: target?.file || null,
      sourceLine: target?.line || null,
    },
  };
}

function parseSourceTarget(source, line, column) {
  if (typeof source !== "string" || !Number.isSafeInteger(line) || line < 1 || line > 2_147_483_647) return null;
  let basename;
  try {
    basename = new URL(source).pathname.split("/").pop();
  } catch {
    basename = source.split(/[\\/]/).pop();
  }
  if (!SOURCE_FILES.has(basename)) return null;
  if (column !== null && column !== undefined &&
      (!Number.isSafeInteger(column) || column < 1 || column > 2_147_483_647)) return null;
  return { file: basename, line, column: Number.isSafeInteger(column) ? column : 1 };
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
    });
}

function validatePatch(patch, expectedFile) {
  if (typeof patch !== "string" || !patch.trim() || Buffer.byteLength(patch, "utf8") > 100 * 1024) {
    return { error: "Yama boş veya izin verilen boyutu aşıyor." };
  }
  if (!SOURCE_FILES.has(expectedFile) || patch.includes("\0")) {
    return { error: "Yama hedef dosyası geçersiz." };
  }

  const lines = patch.replace(/\r\n/g, "\n").split("\n");
  const diffHeaders = lines.filter((line) => line.startsWith("diff --git "));
  const oldHeaders = lines.filter((line) => line.startsWith("--- "));
  const newHeaders = lines.filter((line) => line.startsWith("+++ "));
  if (diffHeaders.length !== 1 || oldHeaders.length !== 1 || newHeaders.length !== 1) {
    return { error: "Yama yalnızca tek bir dosyayı değiştirebilir." };
  }

  const expectedHeader = `diff --git a/${expectedFile} b/${expectedFile}`;
  if (diffHeaders[0] !== expectedHeader || oldHeaders[0] !== `--- a/${expectedFile}` ||
      newHeaders[0] !== `+++ b/${expectedFile}`) {
    return { error: "Yama izin verilen kaynak dosyasının dışına çıkıyor." };
  }
  if (/^(?:GIT binary patch|new file mode|deleted file mode|rename from|rename to)/m.test(patch) ||
      /(?:^|\/)\.\.(?:\/|$)|^\/|^[A-Za-z]:\\/m.test(patch)) {
    return { error: "Yama türü veya dosya yolu güvenli değil." };
  }
  if (!/^@@ /m.test(patch)) return { error: "Yama biçimi geçersiz." };
  return { patch: patch.replace(/\r\n/g, "\n") };
}

module.exports = { parseStackTarget, sanitizeReport, validatePatch, SOURCE_FILES };
