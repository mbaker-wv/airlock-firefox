// Draws Airlock's icon as a 1024×1024 PNG: two sliding airlock doors meeting at an
// interlocking seam, in a teal frame, under a bar of three session colors (like
// container tabs), on a dark rounded square.
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
NSGradient(starting: color(37, 52, 76), ending: color(12, 18, 34))!.draw(in: body, angle: -90)

// Door frame.
let frameRect = NSRect(x: 252, y: 130, width: 520, height: 620)
let frame = NSBezierPath(roundedRect: frameRect, xRadius: 130, yRadius: 130)
frame.lineWidth = 44
color(45, 212, 191).setStroke()
frame.stroke()

// Two doors meeting at a zigzag seam, clipped to the inside of the frame.
let inner = NSBezierPath(roundedRect: frameRect.insetBy(dx: 46, dy: 46), xRadius: 88, yRadius: 88)
NSGraphicsContext.saveGraphicsState()
inner.addClip()
let teeth: [CGFloat] = [-46, 46, -46, 46, -46]
func seam(_ shift: CGFloat) -> [NSPoint] {
    teeth.enumerated().map { i, dx in
        NSPoint(x: 512 + dx + shift,
                y: frameRect.maxY - CGFloat(i) * frameRect.height / CGFloat(teeth.count - 1))
    }
}
let left = NSBezierPath()
left.move(to: NSPoint(x: frameRect.minX, y: frameRect.maxY))
seam(-10).forEach { left.line(to: $0) }
left.line(to: NSPoint(x: frameRect.minX, y: frameRect.minY))
left.close()
color(226, 232, 240).setFill()
left.fill()
let right = NSBezierPath()
right.move(to: NSPoint(x: frameRect.maxX, y: frameRect.maxY))
seam(10).forEach { right.line(to: $0) }
right.line(to: NSPoint(x: frameRect.maxX, y: frameRect.minY))
right.close()
color(186, 198, 214).setFill()
right.fill()
NSGraphicsContext.restoreGraphicsState()

// Session colors over the door, like the colored line on a container tab.
let bar = [color(59, 130, 246), color(34, 197, 94), color(249, 115, 22)]
let barRect = NSRect(x: 252, y: 812, width: 520, height: 56)
let gap: CGFloat = 18
let segment = (barRect.width - gap * CGFloat(bar.count - 1)) / CGFloat(bar.count)
for (i, c) in bar.enumerated() {
    c.setFill()
    NSBezierPath(roundedRect: NSRect(x: barRect.minX + CGFloat(i) * (segment + gap), y: barRect.minY,
                                     width: segment, height: barRect.height), xRadius: 28, yRadius: 28).fill()
}

NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
