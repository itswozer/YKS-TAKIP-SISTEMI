"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { parseStackTarget, sanitizeReport, validatePatch } = require("../sentinel-core");
const { applyPatchToContent, verifySentinelAdminToken } = require("../sentinel");

test("parses only an allowlisted source file from stack frames", () => {
  assert.deepEqual(parseStackTarget("at render (https://example.test/script.js:42:8)"), {
    file: "script.js", line: 42, column: 8,
  });
  assert.equal(parseStackTarget("at load (https://example.test/private.txt:42:8)"), null);
});

test("sanitizes report data and strips URL query strings", () => {
  const result = sanitizeReport({
    message: "Failed for user@example.test",
    stack: "at render (https://example.test/script.js?session=secret:12:3)",
    pageUrl: "https://example.test/study?secret=1#section",
    timestamp: "2026-01-02T03:04:05.000Z",
  });
  assert.equal(result.report.pageUrl, "https://example.test/study");
  assert.equal(result.report.sourceFile, "script.js");
  assert.equal(result.report.stack, "at render (https://example.test/script.js:12:3)");
  assert.match(result.report.message, /\[email redacted\]/);
});

test("accepts a single-file patch only for its declared allowlisted target", () => {
  const patch = [
    "diff --git a/script.js b/script.js",
    "--- a/script.js",
    "+++ b/script.js",
    "@@ -1 +1 @@",
    "-const answer = 1;",
    "+const answer = 2;",
    "",
  ].join("\n");
  assert.equal(validatePatch(patch, "script.js").patch, patch);
  assert.match(validatePatch(patch, "service-worker.js").error, /dışına çıkıyor/);
});

test("rejects traversal, binary, and multi-file patches", () => {
  const traversal = "diff --git a/../secret b/../secret\n--- a/../secret\n+++ b/../secret\n@@ -1 +1 @@\n-a\n+b\n";
  const binary = "diff --git a/script.js b/script.js\nGIT binary patch\n";
  assert.ok(validatePatch(traversal, "script.js").error);
  assert.ok(validatePatch(binary, "script.js").error);
});

test("rejects invalid URLs and unallowlisted source names", () => {
  assert.ok(sanitizeReport({ message: "x", pageUrl: "javascript:alert(1)" }).error);
  const result = sanitizeReport({
    message: "x",
    pageUrl: "https://example.test/",
    source: "https://example.test/private.js",
    line: 3,
    column: 2,
  });
  assert.equal(result.report.sourceFile, null);
});

test("applies an approved diff only to an isolated temporary source copy", async () => {
  const patch = [
    "diff --git a/script.js b/script.js",
    "--- a/script.js",
    "+++ b/script.js",
    "@@ -1 +1 @@",
    "-const answer = 1;",
    "+const answer = 2;",
    "",
  ].join("\n");
  const updated = await applyPatchToContent("script.js", patch, "const answer = 1;\n");
  assert.equal(updated.replace(/\r\n/g, "\n"), "const answer = 2;\n");
  await assert.rejects(applyPatchToContent("script.js", patch, "const answer = 3;\n"), /Git yamayı reddetti/);
});

test("accepts only dedicated Sentinel admin tokens, not normal YKS sessions", () => {
  const secret = "sentinel-test-secret-that-is-long-enough";
  const adminUsername = "sentinel-owner";
  const middleware = verifySentinelAdminToken({ jwtSecret: secret, adminUsername });
  const validToken = jwt.sign(
    { username: adminUsername, role: "sentinel_admin" },
    secret,
    {
      algorithm: "HS256",
      subject: adminUsername,
      expiresIn: "1h",
      issuer: "hedef-yks-api",
      audience: "hedef-yks-sentinel-admin",
    },
  );
  const legacyToken = jwt.sign(
    { username: adminUsername },
    secret,
    {
      algorithm: "HS256",
      subject: adminUsername,
      expiresIn: "1h",
      issuer: "hedef-yks-api",
      audience: "hedef-yks-client",
    },
  );

  function run(token) {
    let status;
    let nextCalled = false;
    const req = { get: () => `Bearer ${token}` };
    const res = { status(value) { status = value; return this; }, json() { return this; } };
    middleware(req, res, () => { nextCalled = true; });
    return { status, nextCalled, user: req.user };
  }

  assert.equal(run(validToken).user.role, "sentinel_admin");
  assert.equal(run(legacyToken).status, 401);
});
