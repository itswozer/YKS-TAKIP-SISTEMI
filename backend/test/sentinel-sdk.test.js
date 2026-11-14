"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadSdk() {
  const listeners = new Map();
  const reports = [];
  const reportUrl = "https://api.example.test/api/sentinel/report";
  const window = {
    location: { href: "https://site.example.test/study?session=private", origin: "https://site.example.test" },
    fetch(input, init) {
      if (input === reportUrl && init?.body) {
        reports.push(JSON.parse(init.body));
        return Promise.resolve({ ok: true, status: 202 });
      }
      return Promise.resolve({ ok: false, status: 500 });
    },
    addEventListener(type, listener) {
      const current = listeners.get(type) || [];
      current.push(listener);
      listeners.set(type, current);
    },
  };
  class TestErrorEvent {
    constructor(values) {
      Object.assign(this, values);
    }
  }
  const source = fs.readFileSync(path.resolve(__dirname, "../../sentinel.js"), "utf8");
  vm.runInNewContext(source, {
    window,
    document: { querySelector: () => ({ content: "https://api.example.test" }) },
    navigator: { userAgent: "Sentinel test browser" },
    URL,
    Error,
    ErrorEvent: TestErrorEvent,
    Date,
    Map,
  });
  return { window, listeners, reports, TestErrorEvent };
}

test("SDK reports HTTP failures without changing the fetch response", async () => {
  const { window, reports } = loadSdk();
  const response = await window.fetch("https://api.example.test/api/data");
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(response.status, 500);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].status, 500);
  assert.equal(reports[0].pageUrl, "https://site.example.test/study");
  assert.equal(reports[0].browser, "Sentinel test browser");
});

test("SDK reports runtime errors and ignores its own reporting endpoint", async () => {
  const { window, listeners, reports, TestErrorEvent } = loadSdk();
  listeners.get("error")[0](new TestErrorEvent({
    error: new Error("test runtime error"),
    message: "test runtime error",
    filename: "https://site.example.test/script.js",
    lineno: 8,
    colno: 2,
  }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reports.length, 1);
  assert.equal(reports[0].type, "runtime");
  assert.equal(reports[0].source, "https://site.example.test/script.js");

  await window.fetch("https://api.example.test/api/sentinel/report");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(reports.length, 1);
});
