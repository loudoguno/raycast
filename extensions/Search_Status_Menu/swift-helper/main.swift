import Cocoa

// MARK: - Status Menu Helper CLI
// Enumerates macOS menu bar items via Accessibility API
// and performs click actions via CGEvent posting.
//
// Usage:
//   status-menu-helper scan              → JSON array of menu bar items
//   status-menu-helper click X Y left    → left-click at (X, Y)
//   status-menu-helper click X Y right   → right-click at (X, Y)

struct MenuBarItem: Codable {
    let title: String
    let processName: String
    let bundleId: String?
    let position: [CGFloat]
    let size: [CGFloat]
    let index: Int
    let pid: pid_t
    let menuBarIndex: Int
}

struct ScanResult: Codable {
    let permitted: Bool
    let items: [MenuBarItem]
}

// MARK: - Accessibility Permission Check

func isAccessibilityPermitted() -> Bool {
    return AXIsProcessTrusted()
}

// MARK: - Scan Menu Bar Items

func scanMenuBarItems() -> ScanResult {
    guard isAccessibilityPermitted() else {
        return ScanResult(permitted: false, items: [])
    }

    var items: [MenuBarItem] = []
    let runningApps = NSWorkspace.shared.runningApplications

    for app in runningApps {
        guard app.activationPolicy == .regular || app.activationPolicy == .accessory else {
            continue
        }

        let pid = app.processIdentifier
        let axApp = AXUIElementCreateApplication(pid)

        // Quick check: does this process have an extras menu bar?
        var extrasBarValue: CFTypeRef?
        let extrasResult = AXUIElementCopyAttributeValue(axApp, "AXExtrasMenuBar" as CFString, &extrasBarValue)
        guard extrasResult == .success, let extrasBar = extrasBarValue else { continue }

        var childrenValue: CFTypeRef?
        let childResult = AXUIElementCopyAttributeValue(extrasBar as! AXUIElement, kAXChildrenAttribute as CFString, &childrenValue)
        guard childResult == .success, let children = childrenValue as? [AXUIElement] else { continue }

        for child in children {
            var titleValue: CFTypeRef?
            AXUIElementCopyAttributeValue(child, kAXTitleAttribute as CFString, &titleValue)
            let title = (titleValue as? String) ?? ""

            var positionValue: CFTypeRef?
            var sizeValue: CFTypeRef?
            AXUIElementCopyAttributeValue(child, kAXPositionAttribute as CFString, &positionValue)
            AXUIElementCopyAttributeValue(child, kAXSizeAttribute as CFString, &sizeValue)

            var point = CGPoint.zero
            var size = CGSize.zero
            if let posVal = positionValue {
                AXValueGetValue(posVal as! AXValue, .cgPoint, &point)
            }
            if let sizeVal = sizeValue {
                AXValueGetValue(sizeVal as! AXValue, .cgSize, &size)
            }

            let displayName = title.isEmpty ? (app.localizedName ?? "Unknown") : title
            items.append(MenuBarItem(
                title: displayName,
                processName: app.localizedName ?? "Unknown",
                bundleId: app.bundleIdentifier,
                position: [point.x, point.y],
                size: [size.width, size.height],
                index: items.count,
                pid: pid,
                menuBarIndex: 1
            ))
        }
    }

    // Sort by X position (left to right) to match visual order
    items.sort { $0.position[0] < $1.position[0] }
    // Re-index after sort
    for i in items.indices {
        items[i] = MenuBarItem(
            title: items[i].title,
            processName: items[i].processName,
            bundleId: items[i].bundleId,
            position: items[i].position,
            size: items[i].size,
            index: i,
            pid: items[i].pid,
            menuBarIndex: items[i].menuBarIndex
        )
    }

    return ScanResult(permitted: true, items: items)
}

// MARK: - Click at Position

func clickAtPosition(x: CGFloat, y: CGFloat, button: String) {
    let point = CGPoint(x: x, y: y)

    if button == "right" {
        let mouseDown = CGEvent(mouseEventSource: nil, mouseType: .rightMouseDown, mouseCursorPosition: point, mouseButton: .right)
        let mouseUp = CGEvent(mouseEventSource: nil, mouseType: .rightMouseUp, mouseCursorPosition: point, mouseButton: .right)
        mouseDown?.post(tap: .cghidEventTap)
        usleep(50_000) // 50ms between down and up
        mouseUp?.post(tap: .cghidEventTap)
    } else {
        let mouseDown = CGEvent(mouseEventSource: nil, mouseType: .leftMouseDown, mouseCursorPosition: point, mouseButton: .left)
        let mouseUp = CGEvent(mouseEventSource: nil, mouseType: .leftMouseUp, mouseCursorPosition: point, mouseButton: .left)
        mouseDown?.post(tap: .cghidEventTap)
        usleep(50_000)
        mouseUp?.post(tap: .cghidEventTap)
    }
}

// MARK: - Main

let args = CommandLine.arguments

guard args.count >= 2 else {
    fputs("Usage: status-menu-helper scan | click X Y [left|right]\n", stderr)
    exit(1)
}

let command = args[1]

switch command {
case "scan":
    let result = scanMenuBarItems()
    let encoder = JSONEncoder()
    if let data = try? encoder.encode(result), let json = String(data: data, encoding: .utf8) {
        print(json)
    } else {
        fputs("Error: Failed to encode scan result\n", stderr)
        exit(1)
    }

case "click":
    guard args.count >= 4,
          let x = Double(args[2]),
          let y = Double(args[3]) else {
        fputs("Usage: status-menu-helper click X Y [left|right]\n", stderr)
        exit(1)
    }
    let button = args.count >= 5 ? args[4] : "left"
    clickAtPosition(x: CGFloat(x), y: CGFloat(y), button: button)

default:
    fputs("Unknown command: \(command)\n", stderr)
    fputs("Usage: status-menu-helper scan | click X Y [left|right]\n", stderr)
    exit(1)
}
