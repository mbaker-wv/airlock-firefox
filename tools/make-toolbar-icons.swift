// Draws Hatrack's toolbar icons: a bold top hat filling the icon, with its band split
// into the three session colors, drawn on a 32-unit grid at 16, 32 and 64 px.
//   toolbar-dark-*.png  dark hat, for light Firefox themes
//   toolbar-light-*.png light hat, for dark Firefox themes
// Usage: swift make-toolbar-icons.swift <icons folder>

import AppKit

func color(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat, _ a: CGFloat = 1) -> NSColor {
    NSColor(srgbRed: r / 255, green: g / 255, blue: b / 255, alpha: a)
}

let variants: [(name: String, hat: NSColor)] = [
    ("dark", color(30, 41, 59)),       // slate on light toolbars
    ("light", color(226, 232, 240)),   // near-white on dark toolbars
]
let sessionColors = [color(59, 130, 246), color(34, 197, 94), color(249, 115, 22)]

func draw(size: Int, hatColor: NSColor) -> NSBitmapImageRep {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8,
                               samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                               colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    // 32-unit grid, y measured from the top.
    let s = CGFloat(size) / 32
    let t = NSAffineTransform()
    t.translateX(by: 0, yBy: CGFloat(size))
    t.scaleX(by: s, yBy: -s)
    t.concat()

    // Crown, slightly wider at the top.
    let crown = NSBezierPath()
    crown.move(to: NSPoint(x: 9, y: 23))
    crown.line(to: NSPoint(x: 8, y: 6))
    crown.curve(to: NSPoint(x: 11, y: 3), controlPoint1: NSPoint(x: 8, y: 4), controlPoint2: NSPoint(x: 9, y: 3))
    crown.line(to: NSPoint(x: 21, y: 3))
    crown.curve(to: NSPoint(x: 24, y: 6), controlPoint1: NSPoint(x: 23, y: 3), controlPoint2: NSPoint(x: 24, y: 4))
    crown.line(to: NSPoint(x: 23, y: 23))
    crown.close()
    hatColor.setFill()
    crown.fill()

    // Band in the session colors.
    NSGraphicsContext.saveGraphicsState()
    crown.addClip()
    for (i, c) in sessionColors.enumerated() {
        c.setFill()
        NSRect(x: 8 + CGFloat(i) * 16 / 3, y: 16, width: 16 / 3 + 0.3, height: 7).fill()
    }
    NSGraphicsContext.restoreGraphicsState()

    // Brim.
    hatColor.setFill()
    NSBezierPath(roundedRect: NSRect(x: 2, y: 22, width: 28, height: 6), xRadius: 3, yRadius: 3).fill()

    NSGraphicsContext.restoreGraphicsState()
    return rep
}

let folder = CommandLine.arguments[1]
for variant in variants {
    for size in [16, 32, 64] {
        let png = draw(size: size, hatColor: variant.hat).representation(using: .png, properties: [:])!
        try! png.write(to: URL(fileURLWithPath: "\(folder)/toolbar-\(variant.name)-\(size).png"))
    }
}
