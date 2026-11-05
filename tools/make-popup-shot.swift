// Composes a 1280×800 store screenshot of Hatrack's toolbar menu: headline and points on
// the left; on the right, a Firefox-style toolbar with the hat button and the menu under it.
// Usage: swift make-popup-shot.swift <popup.png (2x)> <icons folder> <out.png>

import AppKit

let args = CommandLine.arguments
let popup = NSImage(contentsOfFile: args[1])!
let hat = NSImage(contentsOfFile: args[2] + "/toolbar-light-64.png")!
let W: CGFloat = 1280, H: CGFloat = 800

let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(W), pixelsHigh: Int(H), bitsPerSample: 8,
                           samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                           colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
NSGraphicsContext.current!.imageInterpolation = .high

func color(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat, _ a: CGFloat = 1) -> NSColor {
    NSColor(srgbRed: r / 255, green: g / 255, blue: b / 255, alpha: a)
}
func text(_ s: String, _ size: CGFloat, _ c: NSColor, at p: NSPoint, weight: NSFont.Weight = .regular) {
    (s as NSString).draw(at: p, withAttributes: [.font: NSFont.systemFont(ofSize: size, weight: weight), .foregroundColor: c])
}
func rounded(_ r: NSRect, _ radius: CGFloat) -> NSBezierPath { NSBezierPath(roundedRect: r, xRadius: radius, yRadius: radius) }

// Background, matching the main store image.
NSGradient(starting: color(40, 52, 104), ending: color(12, 16, 40))!
    .draw(in: NSRect(x: 0, y: 0, width: W, height: H), angle: -90)

// Left: headline and points.
text("Name your hats.", 54, .white, at: NSPoint(x: 80, y: 500), weight: .bold)
text("Keep the ones you wear", 54, .white, at: NSPoint(x: 80, y: 432), weight: .bold)
text("every day.", 54, .white, at: NSPoint(x: 80, y: 364), weight: .bold)
let points: [(String, NSColor)] = [
    ("Rename a hat: \"Work\", \"Client A\"…", color(55, 173, 255)),
    ("Keep it signed in after closing its tabs", color(81, 205, 0)),
    ("Jump to any hat, or add a tab to it", color(255, 159, 0)),
]
for (i, (p, c)) in points.enumerated() {
    let y = 270 - CGFloat(i) * 52
    c.setFill()
    NSBezierPath(ovalIn: NSRect(x: 84, y: y + 6, width: 18, height: 18)).fill()
    text(p, 23, color(226, 232, 240), at: NSPoint(x: 116, y: y))
}

// Right: a Firefox-style toolbar.
let bar = NSRect(x: 640, y: 690, width: 600, height: 60)
color(43, 42, 51).setFill()
rounded(bar, 14).fill()
color(28, 27, 34).setFill()
rounded(NSRect(x: bar.minX + 16, y: bar.minY + 13, width: 380, height: 34), 8).fill()
text("example.com", 16, color(190, 190, 200), at: NSPoint(x: bar.minX + 32, y: bar.minY + 21))
// Neighboring toolbar buttons, then the highlighted hat button.
color(190, 190, 200).setFill()
for x in [bar.minX + 420, bar.minX + 470] {
    NSBezierPath(ovalIn: NSRect(x: x, y: bar.minY + 21, width: 18, height: 18)).fill()
}
let button = NSRect(x: bar.minX + 508, y: bar.minY + 10, width: 40, height: 40)
color(255, 255, 255, 0.14).setFill()
rounded(button, 8).fill()
hat.draw(in: button.insetBy(dx: 8, dy: 8))
color(190, 190, 200).setFill()
for y in [bar.minY + 22, bar.minY + 29, bar.minY + 36] {
    NSRect(x: bar.minX + 562, y: y, width: 18, height: 3).fill()
}

// The menu, hanging from the hat button.
let menuW: CGFloat = 380
let menuH = menuW * popup.size.height / popup.size.width
let menu = NSRect(x: button.maxX - menuW + 24, y: bar.minY - 12 - menuH, width: menuW, height: menuH)
NSGraphicsContext.saveGraphicsState()
let shadow = NSShadow()
shadow.shadowColor = color(0, 0, 0, 0.5)
shadow.shadowBlurRadius = 30
shadow.shadowOffset = NSSize(width: 0, height: -10)
shadow.set()
color(43, 42, 51).setFill()
rounded(menu, 12).fill()
NSGraphicsContext.restoreGraphicsState()
NSGraphicsContext.saveGraphicsState()
rounded(menu, 12).addClip()
popup.draw(in: menu)
NSGraphicsContext.restoreGraphicsState()

NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: args[3]))
