import SwiftUI
import AppKit

@main
struct BalloonsApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        Settings {
            EmptyView()
        }
    }
}

enum EffectType: String {
    case balloons
    case fireworks
    case snow
    case cupcake
    case campfire
    case feather
    case beer
    case leaves
    case rainbow
    case pixels
    case galaxy
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow?

    func applicationDidFinishLaunching(_ notification: Notification) {
        print("BalloonsApp: Application launched")

        // Hide from dock
        NSApp.setActivationPolicy(.accessory)
        print("BalloonsApp: Activation policy set")

        // Parse command-line arguments to determine which effect to show
        let arguments = CommandLine.arguments
        var effect: EffectType = .balloons // Default to balloons for backwards compatibility

        if arguments.count > 1 {
            let effectArg = arguments[1].lowercased()
            if effectArg == "fireworks" || effectArg == "--effect=fireworks" {
                effect = .fireworks
            } else if effectArg == "snow" || effectArg == "--effect=snow" {
                effect = .snow
            } else if effectArg == "cupcake" || effectArg == "--effect=cupcake" {
                effect = .cupcake
            } else if effectArg == "campfire" || effectArg == "--effect=campfire" {
                effect = .campfire
            } else if effectArg == "feather" || effectArg == "--effect=feather" {
                effect = .feather
            } else if effectArg == "beer" || effectArg == "--effect=beer" {
                effect = .beer
            } else if effectArg == "leaves" || effectArg == "--effect=leaves" {
                effect = .leaves
            } else if effectArg == "rainbow" || effectArg == "--effect=rainbow" {
                effect = .rainbow
            } else if effectArg == "pixels" || effectArg == "--effect=pixels" {
                effect = .pixels
            } else if effectArg == "galaxy" || effectArg == "--effect=galaxy" {
                effect = .galaxy
            }
        }

        print("BalloonsApp: Launching effect - \(effect.rawValue)")

        // Launch the specified effect
        launchEffect(effect)
    }

    func launchEffect(_ effect: EffectType) {
        print("BalloonsApp: Getting screen dimensions")

        // Get screen dimensions
        guard let screen = NSScreen.main else {
            print("BalloonsApp: ERROR - No main screen found")
            return
        }
        let screenFrame = screen.frame
        print("BalloonsApp: Screen frame: \(screenFrame)")

        // Create transparent overlay window
        window = NSWindow(
            contentRect: screenFrame,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )

        window?.isOpaque = false
        window?.backgroundColor = .clear
        window?.level = .floating
        window?.ignoresMouseEvents = true
        window?.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]

        print("BalloonsApp: Window created and configured")

        // Set up the appropriate SwiftUI view based on effect type
        let contentView: any View
        let duration: Double

        switch effect {
        case .balloons:
            contentView = BalloonsView()
            duration = 12 // max delay 2s + max duration 10s
        case .fireworks:
            contentView = FireworksView()
            duration = 8 // Fireworks complete faster
        case .snow:
            contentView = SnowView()
            duration = 10 // max delay 1.5s + max duration 8s for blizzard
        case .cupcake:
            contentView = CupcakeView()
            duration = 8 // Same as fireworks
        case .campfire:
            contentView = CampfireView()
            duration = 10 // max delay 3s + max duration 6s
        case .feather:
            contentView = FeatherView()
            duration = 25 // max delay 5s + max duration 20s - very peaceful
        case .beer:
            contentView = BeerView()
            duration = 6 // 3s fill + 1.5s foam + 1.5s display
        case .leaves:
            contentView = LeavesView()
            duration = 12 // max delay 3s + duration 8s
        case .rainbow:
            contentView = RainbowView()
            duration = 8 // fade in 1.5s + shimmer 4.5s + fade out 1.5s
        case .pixels:
            contentView = PixelsView()
            duration = 8 // cascade animation
        case .galaxy:
            contentView = GalaxyView()
            duration = 8 // warp speed effect with longer streaks
        }

        window?.contentView = NSHostingView(rootView: AnyView(contentView))
        window?.makeKeyAndOrderFront(nil)

        print("BalloonsApp: Window displayed")

        // Auto-close after animation completes
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
            print("BalloonsApp: Auto-closing")
            NSApp.terminate(nil)
        }
    }
}
