// Draws Hatrack's icon as a 1024×1024 PNG: a top hat whose band is split into the
// three session colors (one hat, many accounts), on a dark navy rounded square.
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

// Background (fills more of the canvas than a macOS app icon, so it reads at small sizes).
let body = NSBezierPath(roundedRect: NSRect(x: 40, y: 40, width: 944, height: 944), xRadius: 210, yRadius: 210)
NSGradient(starting: color(40, 52, 104), ending: color(12, 16, 40))!.draw(in: body, angle: -90)

let hatColor = color(241, 245, 249)
let sessionColors = [color(59, 130, 246), color(34, 197, 94), color(249, 115, 22)]

// Soft shadow under the brim.
color(0, 0, 0, 0.28).setFill()
NSBezierPath(ovalIn: NSRect(x: 200, y: 232, width: 624, height: 70)).fill()

// Crown: slightly wider at the top, rounded top corners.
let crownBottom: CGFloat = 352, crownTop: CGFloat = 742
let crown = NSBezierPath()
crown.move(to: NSPoint(x: 322, y: crownBottom))
crown.line(to: NSPoint(x: 302, y: crownTop - 46))
crown.curve(to: NSPoint(x: 348, y: crownTop), controlPoint1: NSPoint(x: 300, y: crownTop - 16), controlPoint2: NSPoint(x: 318, y: crownTop))
crown.line(to: NSPoint(x: 676, y: crownTop))
crown.curve(to: NSPoint(x: 722, y: crownTop - 46), controlPoint1: NSPoint(x: 706, y: crownTop), controlPoint2: NSPoint(x: 724, y: crownTop - 16))
crown.line(to: NSPoint(x: 702, y: crownBottom))
crown.close()
hatColor.setFill()
crown.fill()

// Band: the three session colors, clipped to the crown.
NSGraphicsContext.saveGraphicsState()
crown.addClip()
let bandBottom = crownBottom, bandTop = crownBottom + 104
for (i, c) in sessionColors.enumerated() {
    c.setFill()
    NSRect(x: 290 + CGFloat(i) * 148, y: bandBottom, width: 149, height: bandTop - bandBottom).fill()
}
NSGraphicsContext.restoreGraphicsState()

// Brim.
hatColor.setFill()
NSBezierPath(roundedRect: NSRect(x: 172, y: 292, width: 680, height: 76), xRadius: 38, yRadius: 38).fill()

NSGraphicsContext.restoreGraphicsState()
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
