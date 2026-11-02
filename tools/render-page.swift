// Renders one of Hatrack's pages (popup.html, welcome.html) to a PNG using WebKit,
// with tools/sample-data.js standing in for Firefox's add-on APIs.
// Usage: swift render-page.swift <page.html> <width> <height> <light|dark> <out.png> [scale]

import AppKit
import WebKit

let args = CommandLine.arguments
let page = URL(fileURLWithPath: args[1])
let width = CGFloat(Double(args[2])!), height = CGFloat(Double(args[3])!)
let dark = args[4] == "dark"
let out = URL(fileURLWithPath: args[5])
let scale = args.count > 6 ? CGFloat(Double(args[6])!) : 2

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
app.appearance = NSAppearance(named: dark ? .darkAqua : .aqua)

let stub = try! String(contentsOf: URL(fileURLWithPath: #filePath).deletingLastPathComponent()
    .appendingPathComponent("sample-data.js"), encoding: .utf8)
let config = WKWebViewConfiguration()
config.userContentController.addUserScript(WKUserScript(source: stub, injectionTime: .atDocumentStart, forMainFrameOnly: true))

let window = NSWindow(contentRect: NSRect(x: -10000, y: 0, width: width, height: height),
                      styleMask: [.borderless], backing: .buffered, defer: false)
let webView = WKWebView(frame: NSRect(x: 0, y: 0, width: width, height: height), configuration: config)
webView.appearance = app.appearance
window.contentView = webView
window.orderFrontRegardless()

final class Loader: NSObject, WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Give the page's scripts a moment to fill in sample data.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            let shot = WKSnapshotConfiguration()
            shot.rect = NSRect(x: 0, y: 0, width: width, height: height)
            shot.snapshotWidth = NSNumber(value: Double(width * scale))
            webView.takeSnapshot(with: shot) { image, error in
                guard let image, let tiff = image.tiffRepresentation,
                      let png = NSBitmapImageRep(data: tiff)?.representation(using: .png, properties: [:]) else {
                    print("snapshot failed: \(String(describing: error))")
                    exit(1)
                }
                try! png.write(to: out)
                exit(0)
            }
        }
    }
}
let loader = Loader()
webView.navigationDelegate = loader
webView.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
app.run()
