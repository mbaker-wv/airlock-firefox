// Stand-in for Firefox's add-on APIs, used only when rendering store screenshots of
// popup.html and welcome.html outside Firefox. Not part of the add-on.
window.browser = {
  tabs: {
    query: async () => [{ id: 1, windowId: 1, index: 0, cookieStoreId: "hat-1", url: "https://example.com" }],
  },
  runtime: {
    sendMessage: async (msg) => {
      if (msg.type === "describe") {
        return {
          session: { name: "Work", colorCode: "#37adff", kept: true },
          kept: [
            { id: "hat-2", name: "Personal", colorCode: "#51cd00" },
            { id: "hat-3", name: "Client A", colorCode: "#ff9f00" },
          ],
          auto: true,
        };
      }
      if (msg.type === "getAuto") return true;
    },
    openOptionsPage: () => {},
    getURL: (path) => path,
  },
  privacy: {
    services: { passwordSavingEnabled: { get: async () => ({ value: false }) } },
  },
};
