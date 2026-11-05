// Stand-in for Firefox's add-on APIs, used only when rendering store screenshots of
// popup.html, hats.html and welcome.html outside Firefox. Not part of the add-on.
const sampleHats = [
  { id: "hat-1", name: "Work", color: "blue", colorCode: "#37adff", number: 1, kept: true, tabCount: 3, eraseAt: null },
  { id: "hat-2", name: "Personal", color: "green", colorCode: "#51cd00", number: 2, kept: true, tabCount: 1, eraseAt: null },
  { id: "hat-3", name: "Client A", color: "orange", colorCode: "#ff9f00", number: 3, kept: false, tabCount: 2, eraseAt: null },
  { id: "hat-4", name: "Hat 4", color: "purple", colorCode: "#af51f5", number: 4, kept: false, tabCount: 0, eraseAt: Date.now() + 90_000 },
];
const noop = { addListener: () => {} };

window.browser = {
  tabs: {
    query: async () => [{ id: 1, windowId: 1, index: 0, cookieStoreId: "hat-1", url: "https://example.com" }],
    create: async () => {},
    onCreated: noop,
    onRemoved: noop,
  },
  windows: { getCurrent: async () => ({ id: 1 }) },
  contextualIdentities: { onUpdated: noop, onRemoved: noop },
  runtime: {
    sendMessage: async (msg) => {
      if (msg.type === "describe") return { current: "hat-1", hats: sampleHats, auto: true };
      if (msg.type === "hats") return sampleHats;
      if (msg.type === "settings") return { auto: true, catchLinks: true, canCatchLinks: true, graceMinutes: 2 };
    },
    openOptionsPage: () => {},
    getURL: (path) => path,
  },
  permissions: {
    request: async () => true,
    remove: async () => true,
  },
  privacy: {
    services: { passwordSavingEnabled: { get: async () => ({ value: false }) } },
  },
};
