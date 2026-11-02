// Draws Airlock's 1280×800 store/README image: the icon, name and tagline on the left,
// and three browser windows on the right, each in its own colored session and signed
// into a different (made-up) account.
// Usage: swift make-store-image.swift <icon.png> <out.png>

import AppKit

let W = 1280, H = 800
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: W, pixelsHigh: H, bitsPerSample: 8,
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

// Background.
NSGradient(starting: color(37, 52, 76), ending: color(12, 18, 34))!
    .draw(in: NSRect(x: 0, y: 0, width: W, height: H), angle: -90)

// Left: icon, name, tagline, three points.
NSImage(contentsOfFile: CommandLine.arguments[1])!.draw(in: NSRect(x: 80, y: 480, width: 190, height: 190))
text("Airlock", 76, .white, at: NSPoint(x: 80, y: 370), weight: .bold)
text("Several accounts on the same site,", 28, color(203, 213, 225), at: NSPoint(x: 82, y: 322))
text("side by side. Never mixed up.", 28, color(203, 213, 225), at: NSPoint(x: 82, y: 286))

let sessions: [(name: String, account: String, initial: String, color: NSColor)] = [
    ("Work", "alex@work.example", "A", color(59, 130, 246)),
    ("Personal", "alex.home@mail.example", "A", color(34, 197, 94)),
    ("Client A", "alex@client-a.example", "A", color(249, 115, 22)),
]
let points = ["Every tab gets its own private session",
              "Logins vanish when you close the tab",
              "Keep the accounts you use every day"]
for (i, p) in points.enumerated() {
    let y = 210 - CGFloat(i) * 50
    sessions[i].color.setFill()
    NSBezierPath(ovalIn: NSRect(x: 84, y: y + 6, width: 18, height: 18)).fill()
    text(p, 22, color(226, 232, 240), at: NSPoint(x: 116, y: y))
}

// Right: three cascading browser windows, one per session, each showing its tab and account.
for (i, s) in sessions.enumerated() {
    let x = 560 + CGFloat(i) * 70
    let y = 490 - CGFloat(i) * 175
    let win = NSRect(x: x, y: y, width: 560, height: 270)

    NSGraphicsContext.saveGraphicsState()
    let shadow = NSShadow()
    shadow.shadowColor = color(0, 0, 0, 0.45)
    shadow.shadowBlurRadius = 30
    shadow.shadowOffset = NSSize(width: 0, height: -12)
    shadow.set()
    color(248, 250, 252).setFill()
    rounded(win, 16).fill()
    NSGraphicsContext.restoreGraphicsState()

    // Title bar with traffic lights and the session's tab.
    color(226, 232, 240).setFill()
    let bar = NSBezierPath()
    bar.appendRoundedRect(NSRect(x: x, y: y + 214, width: 560, height: 56), xRadius: 16, yRadius: 16)
    bar.fill()
    NSRect(x: x, y: y + 214, width: 560, height: 20).fill()
    for (j, c) in [color(255, 95, 87), color(254, 188, 46), color(40, 200, 64)].enumerated() {
        c.setFill()
        NSBezierPath(ovalIn: NSRect(x: x + 20 + CGFloat(j) * 22, y: y + 236, width: 13, height: 13)).fill()
    }
    let tab = NSRect(x: x + 100, y: y + 214, width: 200, height: 44)
    color(248, 250, 252).setFill()
    rounded(tab, 10).fill()
    NSRect(x: tab.minX, y: tab.minY, width: tab.width, height: 12).fill()
    s.color.setFill()
    rounded(NSRect(x: tab.minX + 12, y: tab.maxY - 6, width: tab.width - 24, height: 4), 2).fill()
    text(s.name, 16, color(30, 41, 59), at: NSPoint(x: tab.minX + 16, y: tab.minY + 10), weight: .semibold)

    // Address bar with the session's name pill.
    color(255, 255, 255).setFill()
    let address = NSRect(x: x + 20, y: y + 166, width: 520, height: 36)
    rounded(address, 10).fill()
    color(203, 213, 225).setStroke()
    rounded(address, 10).stroke()
    text("example.com", 15, color(100, 116, 139), at: NSPoint(x: address.minX + 14, y: address.minY + 9))
    s.color.withAlphaComponent(0.15).setFill()
    let pill = NSRect(x: address.maxX - 110, y: address.minY + 6, width: 98, height: 24)
    rounded(pill, 12).fill()
    text(s.name, 13, s.color, at: NSPoint(x: pill.minX + 12, y: pill.minY + 4), weight: .semibold)

    // Page: "Signed in as" with an avatar.
    s.color.setFill()
    NSBezierPath(ovalIn: NSRect(x: x + 30, y: y + 96, width: 64, height: 64)).fill()
    text(s.initial, 30, .white, at: NSPoint(x: x + 50, y: y + 109), weight: .bold)
    text("Signed in as", 15, color(100, 116, 139), at: NSPoint(x: x + 112, y: y + 134))
    text(s.account, 22, color(15, 23, 42), at: NSPoint(x: x + 112, y: y + 102), weight: .semibold)
    color(226, 232, 240).setFill()
    rounded(NSRect(x: x + 30, y: y + 46, width: 420, height: 16), 8).fill()
    rounded(NSRect(x: x + 30, y: y + 20, width: 300, height: 16), 8).fill()
}

NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[2]))
