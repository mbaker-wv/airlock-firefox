// Draws Airlock's toolbar icons: a simplified, bold version of the main icon with no
// background (an arched door filling the icon, its seam, and the three session colors
// as its threshold), drawn on a 32-unit grid at 16, 32 and 64 px.
//   toolbar-dark-*.png  dark frame, for light Firefox themes
//   toolbar-light-*.png light frame, for dark Firefox themes
// Usage: swift make-toolbar-icons.swift <icons folder>

import AppKit

func color(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat, _ a: CGFloat = 1) -> NSColor {
    NSColor(srgbRed: r / 255, green: g / 255, blue: b / 255, alpha: a)
}

let variants: [(name: String, frame: NSColor)] = [
    ("dark", color(15, 118, 110)),     // deep teal on light toolbars
    ("light", color(94, 234, 212)),    // bright teal on dark toolbars
]
let sessionColors = [color(59, 130, 246), color(34, 197, 94), color(249, 115, 22)]

func draw(size: Int, frameColor: NSColor) -> NSBitmapImageRep {
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

    // Door: an arched doorway filling the whole icon (a plain square with a center line
    // reads as a pause button), lightly tinted inside, with a straight center seam
    // (a zigzag reads as "S" at 16 px).
    let door = NSBezierPath()
    door.move(to: NSPoint(x: 5, y: 27))
    door.line(to: NSPoint(x: 5, y: 14))
    door.appendArc(withCenter: NSPoint(x: 16, y: 14), radius: 11, startAngle: 180, endAngle: 0, clockwise: false)
    door.line(to: NSPoint(x: 27, y: 27))
    frameColor.withAlphaComponent(0.18).setFill()
    door.fill()
    door.lineWidth = 4
    door.lineJoinStyle = .round
    frameColor.setStroke()
    door.stroke()

    let seam = NSBezierPath()
    seam.move(to: NSPoint(x: 16, y: 4))
    seam.line(to: NSPoint(x: 16, y: 27))
    seam.lineWidth = 2.5
    seam.stroke()

    // Threshold: one solid bar along the bottom of the door, split into the session colors.
    NSGraphicsContext.saveGraphicsState()
    NSBezierPath(roundedRect: NSRect(x: 2, y: 25, width: 28, height: 6), xRadius: 2.5, yRadius: 2.5).addClip()
    for (i, c) in sessionColors.enumerated() {
        c.setFill()
        NSRect(x: 2 + CGFloat(i) * 28 / 3, y: 25, width: 28 / 3 + 0.5, height: 6).fill()
    }
    NSGraphicsContext.restoreGraphicsState()

    NSGraphicsContext.restoreGraphicsState()
    return rep
}

let folder = CommandLine.arguments[1]
for variant in variants {
    for size in [16, 32, 64] {
        let png = draw(size: size, frameColor: variant.frame).representation(using: .png, properties: [:])!
        try! png.write(to: URL(fileURLWithPath: "\(folder)/toolbar-\(variant.name)-\(size).png"))
    }
}
