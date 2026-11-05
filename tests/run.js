// Runs the behavior tests: joins the fake browser, the real background.js and the tests
// into one script, so they share the same globals the way an add-on's background page does.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const read = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
vm.runInThisContext([read("tests/harness.js"), read("background.js"), read("tests/background.test.js")].join("\n;\n"));
