"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseStackTarget, sanitizeReport, validatePatch } = require("../sentinel-core");

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
