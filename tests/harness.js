// Test harness: a fake `browser` (Firefox's add-on APIs) for background.js.
// Run from the add-on folder with Node:  node tests/run.js
const print = globalThis.print || console.log;
let nextTab = 100, nextContainer = 1;
const tabs = new Map();          // id -> tab
const containers = new Map();    // cookieStoreId -> {name, color, colorCode}
const removedData = [];
const badges = [];
const listeners = {};
let granted = false;
const storage = {};
const timers = [];
let clock = 1_000_000;

Date.now = () => clock;
globalThis.setTimeout = (fn, ms) => { const t = { fn, at: clock + (ms || 0), id: timers.length + 1 }; timers.push(t); return t.id; };
globalThis.clearTimeout = (id) => { const t = timers.find(t => t.id === id); if (t) t.fn = null; };
async function tick(ms) {
  const end = clock + ms;
  for (;;) {
    const due = timers.filter(t => t.fn && t.at <= end).sort((a, b) => a.at - b.at)[0];
    if (!due) break;
    clock = Math.max(clock, due.at);   // advance time to each timer in turn
    const fn = due.fn; due.fn = null; await fn();
    await settle();
  }
  clock = end;
  await settle();
}
async function settle() { for (let i = 0; i < 50; i++) await Promise.resolve(); }

function on(name) { return { addListener: (fn) => { (listeners[name] ||= []).push(fn); } }; }
async function fire(name, ...args) { let r; for (const fn of listeners[name] || []) r = await fn(...args); await settle(); return r; }

const colorCodes = { blue: "#37adff", green: "#51cd00", orange: "#ff9f00", purple: "#af51f5", red: "#ff613d", yellow: "#ffcb00", turquoise: "#00c79a", pink: "#ff4bda" };

globalThis.browser = {
  storage: { local: { get: async (k) => ({ [k]: storage[k] }), set: async (o) => Object.assign(storage, JSON.parse(JSON.stringify(o))) } },
  contextualIdentities: {
    query: async () => [...containers.keys()].map(id => ({ cookieStoreId: id })),
    create: async ({ name, color }) => { const id = "firefox-container-" + nextContainer++; containers.set(id, { name, color, colorCode: colorCodes[color] }); return { cookieStoreId: id, ...containers.get(id) }; },
    get: async (id) => { if (!containers.has(id)) throw new Error("no"); return containers.get(id); },
    update: async (id, { name, color }) => { const c = containers.get(id); if (name) c.name = name; if (color) { c.color = color; c.colorCode = colorCodes[color]; } },
    remove: async (id) => { containers.delete(id); },
    onUpdated: on("ci.onUpdated"),
  },
  browsingData: { remove: async (opts) => { removedData.push(opts.cookieStoreId); } },
  privacy: { services: { passwordSavingEnabled: { set: async () => {} } } },
  permissions: { contains: async () => granted, onAdded: on("perm.add"), onRemoved: on("perm.remove") },
  tabs: {
    query: async (q) => [...tabs.values()].filter(t => (q.cookieStoreId ? t.cookieStoreId === q.cookieStoreId : true) && (q.active ? t.active : true) && (q.windowId ? t.windowId === q.windowId : true)),
    create: async ({ cookieStoreId = "firefox-default", url, windowId = 1, index = 0 }) => { const t = { id: nextTab++, cookieStoreId, url: url || "about:newtab", windowId, index, active: true, status: "complete" }; tabs.set(t.id, t); return t; },
    get: async (id) => { if (!tabs.has(id)) throw new Error("no tab"); return tabs.get(id); },
    remove: async (id) => { tabs.delete(id); await fire("tabs.onRemoved", id); },
    update: async (id, { active }) => { for (const t of tabs.values()) if (active) t.active = t.id === id; },
    onCreated: on("tabs.onCreated"), onRemoved: on("tabs.onRemoved"), onActivated: on("tabs.onActivated"),
  },
  windows: { getAll: async () => [{ id: 1 }], update: async () => {} },
  browserAction: {
    setBadgeText: async ({ text }) => badges.push(text),
    setBadgeBackgroundColor: async () => {}, setBadgeTextColor: async () => {},
  },
  runtime: { onInstalled: on("runtime.onInstalled"), onMessage: on("runtime.onMessage"), getURL: (p) => p },
  webRequest: { onBeforeRequest: { addListener: (fn) => (listeners["webRequest"] ||= []).push(fn) } },
  commands: { onCommand: on("commands") },
  menus: { create: () => {}, onClicked: on("menus.onClicked") },
};

let failures = 0;
function check(label, ok) { print((ok ? "PASS  " : "FAIL  ") + label); if (!ok) failures++; }
