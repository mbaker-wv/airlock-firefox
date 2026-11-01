// Draws Airlock's icon as a 1024×1024 PNG: a sealed hatch on a teal rounded square.
// Usage: swift make-icon.swift out.png   (then resize to icons/icon-48/96/128.png)

import AppKit

let size = 1024
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8,
                           samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                           colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)

func color(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat, _ a: CGFloat = 1) -> NSColor {
    NSColor(srgbRed: r / 255, green: g / 255, blue: b / 255, alpha: a)
}

// Background (fills more of the canvas than a macOS app icon, so it reads at toolbar size).
let body = NSBezierPath(roundedRect: NSRect(x: 40, y: 40, width: 944, height: 944), xRadius: 210, yRadius: 210)
NSGradient(starting: color(22, 190, 170), ending: color(12, 60, 110))!.draw(in: body, angle: -90)

let center = NSPoint(x: 512, y: 512)
let white = color(255, 255, 255)

// Hatch door: soft fill plus a thick ring.
color(255, 255, 255, 0.16).setFill()
NSBezierPath(ovalIn: NSRect(x: center.x - 330, y: center.y - 330, width: 660, height: 660)).fill()
let ring = NSBezierPath(ovalIn: NSRect(x: center.x - 330, y: center.y - 330, width: 660, height: 660))
ring.lineWidth = 64
white.setStroke()
ring.stroke()

// Locking wheel: four spokes and a hub.
for angle in stride(from: 0.0, to: Double.pi, by: Double.pi / 2) {
    let spoke = NSBezierPath()
    spoke.move(to: NSPoint(x: center.x + cos(angle) * 210, y: center.y + sin(angle) * 210))
    spoke.line(to: NSPoint(x: center.x - cos(angle) * 210, y: center.y - sin(angle) * 210))
    spoke.lineWidth = 56
    spoke.lineCapStyle = .round
    spoke.stroke()
}
let wheel = NSBezierPath(ovalIn: NSRect(x: center.x - 210, y: center.y - 210, width: 420, height: 420))
wheel.lineWidth = 44
wheel.stroke()
white.setFill()
NSBezierPath(ovalIn: NSRect(x: center.x - 70, y: center.y - 70, width: 140, height: 140)).fill()

NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
