// pwa-forge — drive Chrome's "Install page as app" flow from the command line.
//
// Chrome's ⋮ menu is a real accessibility menu: the button is an AXPopUpButton
// titled "Chrome", and every item under it is an AXMenuItem that responds to
// AXPress. Submenus populate lazily — pressing the parent spawns the submenu as
// a NEW top-level AXMenu, so we re-scan the app after each press instead of
// walking into the parent's (empty) child.
//
// Usage:
//   pwa-forge install [--name "App Name"] [--timeout 8]
//   pwa-forge list
//   pwa-forge check

import Cocoa
import ApplicationServices

// MARK: - AX conveniences

func axGet(_ el: AXUIElement, _ key: String) -> Any? {
  var value: CFTypeRef?
  return AXUIElementCopyAttributeValue(el, key as CFString, &value) == .success ? value : nil
}

func axChildren(_ el: AXUIElement) -> [AXUIElement] {
  axGet(el, kAXChildrenAttribute as String) as? [AXUIElement] ?? []
}

func axString(_ el: AXUIElement, _ key: String) -> String {
  axGet(el, key) as? String ?? ""
}

func axRole(_ el: AXUIElement) -> String { axString(el, kAXRoleAttribute as String) }

/// Chrome labels some elements with AXTitle and others with AXDescription.
func axLabel(_ el: AXUIElement) -> String {
  let title = axString(el, kAXTitleAttribute as String)
  return title.isEmpty ? axString(el, kAXDescriptionAttribute as String) : title
}

func axPress(_ el: AXUIElement) -> Bool {
  AXUIElementPerformAction(el, kAXPressAction as CFString) == .success
}

// MARK: - Typing into the dialog
//
// Two dead ends worth remembering, both of which look like they work:
//   1. Setting kAXValueAttribute on the app-name field updates the value the
//      accessibility tree reports but NOT the model behind the dialog, so
//      Chrome installs under the old name and the rename vanishes silently.
//   2. CGEvent + keyboardSetUnicodeString posts events Chrome's Views text
//      field ignores outright — the field just stays empty.
// System Events' `keystroke` does the keyboard-layout translation Chrome wants,
// and it is the only approach here that survived a check against the installed
// bundle on disk. It types into the frontmost app, so activate Chrome first.

@discardableResult
func systemEvents(_ script: String) -> Bool {
  let task = Process()
  task.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
  task.arguments = ["-e", "tell application \"System Events\" to \(script)"]
  task.standardError = FileHandle.nullDevice
  try? task.run()
  task.waitUntilExit()
  return task.terminationStatus == 0
}

func typeText(_ text: String) {
  let escaped = text.replacingOccurrences(of: "\\", with: "\\\\")
                    .replacingOccurrences(of: "\"", with: "\\\"")
  systemEvents("keystroke \"\(escaped)\"")
}

func selectAll() { systemEvents("keystroke \"a\" using command down") }

let maxDepth = 16

func axFirst(_ el: AXUIElement, depth: Int = 0, where match: (AXUIElement) -> Bool) -> AXUIElement? {
  if depth > maxDepth { return nil }
  if match(el) { return el }
  for child in axChildren(el) {
    if let hit = axFirst(child, depth: depth + 1, where: match) { return hit }
  }
  return nil
}

func axAll(_ el: AXUIElement, depth: Int = 0, where match: (AXUIElement) -> Bool) -> [AXUIElement] {
  if depth > maxDepth { return [] }
  var found = match(el) ? [el] : []
  for child in axChildren(el) { found += axAll(child, depth: depth + 1, where: match) }
  return found
}

/// Poll until `probe` returns non-nil or the deadline passes. Chrome builds menus
/// and dialogs asynchronously, so every wait here is a deadline, never a sleep.
func waitFor<T>(_ timeout: TimeInterval, _ probe: () -> T?) -> T? {
  let deadline = Date().addingTimeInterval(timeout)
  while Date() < deadline {
    if let value = probe() { return value }
    usleep(60_000)
  }
  return nil
}

// MARK: - Output

func fail(_ message: String, hint: String? = nil) -> Never {
  var payload: [String: Any] = ["ok": false, "error": message]
  if let hint { payload["hint"] = hint }
  emit(payload)
  exit(1)
}

func emit(_ payload: [String: Any]) {
  let data = try! JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys])
  print(String(data: data, encoding: .utf8)!)
}

// MARK: - Chrome handles

let chromeBundleID = "com.google.Chrome"
let menuButtonLabel = "Chrome"           // the ⋮ button's AX title
let shareSubmenuLabel = "Cast, Save"     // prefix of "Cast, Save, and Share"
let chromeAppsDir = ("~/Applications/Chrome Apps.localized" as NSString).expandingTildeInPath

func requireAccessibility() {
  guard AXIsProcessTrusted() else {
    fail("Accessibility permission denied for the calling process.",
         hint: "System Settings → Privacy & Security → Accessibility → enable Raycast (and your terminal, if running by hand).")
  }
}

func chromeApp() -> NSRunningApplication {
  guard let app = NSRunningApplication.runningApplications(withBundleIdentifier: chromeBundleID).first else {
    fail("Google Chrome is not running.")
  }
  return app
}

/// Chrome only builds its full AX tree once an assistive client asks for it.
func chromeAXElement(_ app: NSRunningApplication) -> AXUIElement {
  let el = AXUIElementCreateApplication(app.processIdentifier)
  AXUIElementSetAttributeValue(el, "AXManualAccessibility" as CFString, kCFBooleanTrue)
  return el
}

/// The ⋮ button of the window the user is actually looking at. Raycast steals
/// focus to run us, so activate Chrome first and let its focused window settle.
func focusedChromeWindow(_ ax: AXUIElement) -> AXUIElement? {
  waitFor(3) {
    guard let raw = axGet(ax, kAXFocusedWindowAttribute as String) else { return nil }
    let window = raw as! AXUIElement
    return axFirst(window, where: { axRole($0) == "AXPopUpButton" && axLabel($0) == menuButtonLabel }) != nil
      ? window : nil
  }
}

// MARK: - install

/// Every menu lookup here is scoped to one window, never to the application.
/// Two things bite otherwise:
///   1. Chrome's ⋮ menu hangs off its own AXWindow, but the macOS menu-bar menus
///      (Apple menu, File, Edit…) hang off AXMenuBar under the SAME app element,
///      so an app-wide search happily returns "About This Mac".
///   2. Chrome caches each window's ⋮ menu in the AX tree with its children and
///      geometry intact even while it is closed. There is no "is it open" signal
///      to filter on — a search from the app root returns whichever window
///      opened its menu first, which is usually not the one the user is looking
///      at, and pressing that stale menu's items silently does nothing.
func menusIn(_ window: AXUIElement) -> [AXUIElement] {
  axAll(window, where: { axRole($0) == "AXMenu" && !axChildren($0).isEmpty })
}

func dismissOpenMenus(_ window: AXUIElement) {
  for menu in menusIn(window) {
    AXUIElementPerformAction(menu, kAXCancelAction as CFString)
  }
  usleep(150_000)
}

func openMenu(_ window: AXUIElement) -> AXUIElement {
  guard let button = axFirst(window, where: { axRole($0) == "AXPopUpButton" && axLabel($0) == menuButtonLabel }) else {
    fail("Could not find Chrome's ⋮ menu button in the focused window.")
  }
  guard axPress(button) else { fail("Chrome's ⋮ menu button refused to open.") }
  guard let menu = waitFor(3, {
    menusIn(window).first { menu in
      axChildren(menu).contains { axLabel($0).hasPrefix(shareSubmenuLabel) }
    }
  }) else {
    fail("Chrome's ⋮ menu did not open.")
  }
  return menu
}

/// Find the "Install …" item under Cast, Save, and Share. Its text varies by
/// page — "Install Page as App…" for a plain page, "Install Excalidraw" for a
/// site with a web app manifest — so match the verb, not the whole string.
///
/// Pressing the submenu parent spawns the submenu as a separate AXMenu rather
/// than filling in the parent's own (permanently empty) AXMenu child, which is
/// why this re-scans the window instead of walking down from `share`.
func findInstallItem(_ window: AXUIElement, _ menu: AXUIElement) -> AXUIElement? {
  guard let share = axChildren(menu).first(where: { axLabel($0).hasPrefix(shareSubmenuLabel) }) else {
    return nil
  }
  _ = axPress(share)
  return waitFor(2) {
    for m in menusIn(window) {
      for item in axChildren(m) where axLabel(item).hasPrefix("Install") { return item }
    }
    return nil
  }
}

/// The confirm dialog differs by page: a plain page gets "Install this page as an
/// app" with an editable name field, while a site with a web app manifest gets a
/// bare "Install app" with no field at all. Identify it by shape — the only
/// Chrome window carrying an Install button — rather than by title.
func findInstallDialog(_ ax: AXUIElement, timeout: TimeInterval) -> AXUIElement? {
  waitFor(timeout) {
    guard let windows = axGet(ax, kAXWindowsAttribute as String) as? [AXUIElement] else { return nil }
    return windows.first { w in
      axFirst(w, where: { axRole($0) == "AXButton" && axLabel($0) == "Install" }) != nil
    }
  }
}

func installDialogIsOpen(_ ax: AXUIElement) -> Bool {
  findInstallDialogNow(ax) != nil
}

func findInstallDialogNow(_ ax: AXUIElement) -> AXUIElement? {
  guard let windows = axGet(ax, kAXWindowsAttribute as String) as? [AXUIElement] else { return nil }
  return windows.first { w in
    axFirst(w, where: { axRole($0) == "AXButton" && axLabel($0) == "Install" }) != nil
  }
}

func installedAppNames() -> Set<String> {
  let contents = (try? FileManager.default.contentsOfDirectory(atPath: chromeAppsDir)) ?? []
  return Set(contents.filter { $0.hasSuffix(".app") }.map { String($0.dropLast(4)) })
}

func runInstall(name: String?, timeout: TimeInterval) {
  requireAccessibility()
  let app = chromeApp()
  app.activate()
  let ax = chromeAXElement(app)

  guard let window = focusedChromeWindow(ax) else {
    fail("No focused Chrome browser window.", hint: "Chrome may only have app windows or dialogs open.")
  }
  let pageTitle = axLabel(window)
  let before = installedAppNames()

  dismissOpenMenus(window)
  let menu = openMenu(window)
  guard let installItem = findInstallItem(window, menu) else {
    dismissOpenMenus(window)
    fail("Chrome offers no \"Install…\" item for this page — it is most likely already installed as an app.",
         hint: "Check \(chromeAppsDir), or run: pwa-forge list")
  }
  let itemLabel = axLabel(installItem)
  guard axPress(installItem) else { fail("Could not activate \"\(itemLabel)\".") }

  guard let dialog = findInstallDialog(ax, timeout: timeout) else {
    fail("Chrome's install dialog never appeared.")
  }

  let nameField = axFirst(dialog, where: { axRole($0) == "AXTextField" })
  let defaultName = nameField.flatMap { axGet($0, kAXValueAttribute as String) as? String } ?? ""

  // Chrome ignores a synthetic press unless its dialog is the active window, and
  // it needs a beat after the dialog paints before the press lands at all.
  app.activate()
  AXUIElementPerformAction(dialog, kAXRaiseAction as CFString)
  AXUIElementSetAttributeValue(ax, kAXFocusedWindowAttribute as CFString, dialog)
  usleep(600_000)

  if let name, let field = nameField {
    AXUIElementSetAttributeValue(field, kAXFocusedAttribute as CFString, kCFBooleanTrue)
    usleep(200_000)
    selectAll()
    typeText(name)
    usleep(250_000)
    // An empty name leaves Install inert and the dialog stranded on screen —
    // better to install under Chrome's suggestion than to hang.
    let typed = axGet(field, kAXValueAttribute as String) as? String ?? ""
    if typed.isEmpty && !defaultName.isEmpty { typeText(defaultName) }
  }

  // Press until the dialog actually goes away. A press that returns .success can
  // still be swallowed while the dialog is settling, and re-finding the button
  // each round avoids acting on a stale element.
  var dismissed = false
  for _ in 0..<5 {
    guard let live = findInstallDialogNow(ax),
          let button = axFirst(live, where: { axRole($0) == "AXButton" && axLabel($0) == "Install" })
    else { dismissed = true; break }
    _ = axPress(button)
    if waitFor(1.5, { installDialogIsOpen(ax) ? nil : true }) != nil { dismissed = true; break }
  }
  guard dismissed else {
    fail("Chrome's install dialog would not accept the Install press.",
         hint: "Bring Chrome to the front and try again — the dialog is still open.")
  }

  // Chrome writes the .app bundle asynchronously. The click closing the dialog
  // proves nothing — only the bundle on disk does.
  guard let installed = waitFor(timeout, { installedAppNames().subtracting(before).first }) else {
    fail("Pressed Install but no app bundle appeared in \(chromeAppsDir).",
         hint: "The install may have been declined, or Chrome is still writing it.")
  }

  emit([
    "ok": true,
    "installed": installed,
    "requested_name": name ?? defaultName,
    "menu_item": itemLabel,
    "page": pageTitle,
    "path": "\(chromeAppsDir)/\(installed).app",
  ])
}

// MARK: - list

func runList() {
  let fm = FileManager.default
  let entries = (try? fm.contentsOfDirectory(atPath: chromeAppsDir)) ?? []
  var apps: [[String: Any]] = []
  for entry in entries.sorted() where entry.hasSuffix(".app") {
    let plistPath = "\(chromeAppsDir)/\(entry)/Contents/Info.plist"
    guard let data = fm.contents(atPath: plistPath),
          let plist = try? PropertyListSerialization.propertyList(from: data, format: nil) as? [String: Any]
    else { continue }
    apps.append([
      "name": plist["CrAppModeShortcutName"] as? String ?? String(entry.dropLast(4)),
      "url": plist["CrAppModeShortcutURL"] as? String ?? "",
      "app_id": plist["CrAppModeShortcutID"] as? String ?? "",
      "path": "\(chromeAppsDir)/\(entry)",
    ])
  }
  emit(["ok": true, "count": apps.count, "apps": apps])
}

// MARK: - main

var args = Array(CommandLine.arguments.dropFirst())
let command = args.first ?? "install"
if !args.isEmpty { args.removeFirst() }

switch command {
case "install":
  var name: String?
  var timeout: TimeInterval = 8
  var i = 0
  while i < args.count {
    switch args[i] {
    case "--name" where i + 1 < args.count:
      let value = args[i + 1].trimmingCharacters(in: .whitespaces)
      if !value.isEmpty { name = value }
      i += 2
    case "--timeout" where i + 1 < args.count:
      timeout = Double(args[i + 1]) ?? 8
      i += 2
    default:
      i += 1
    }
  }
  runInstall(name: name, timeout: timeout)

case "list":
  runList()

case "check":
  emit([
    "ok": AXIsProcessTrusted(),
    "accessibility_trusted": AXIsProcessTrusted(),
    "chrome_running": !NSRunningApplication.runningApplications(withBundleIdentifier: chromeBundleID).isEmpty,
  ])

default:
  fail("Unknown command \"\(command)\".", hint: "Use: install | list | check")
}
