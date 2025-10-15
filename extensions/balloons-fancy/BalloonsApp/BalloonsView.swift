import SwiftUI

struct Balloon: Identifiable, Equatable {
    let id = UUID()
    let color: Color
    let startX: CGFloat
    let delay: Double
    let duration: Double
    let drift: CGFloat
    let size: CGFloat  // Varying sizes
    var offsetY: CGFloat = 0

    static func == (lhs: Balloon, rhs: Balloon) -> Bool {
        lhs.id == rhs.id
    }
}

struct BalloonsView: View {
    @State private var balloons: [Balloon] = []
    @State private var animate = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.clear

                ForEach(balloons) { balloon in
                    BalloonShape(color: balloon.color, size: balloon.size)
                        .position(
                            x: balloon.startX + (animate ? balloon.drift : 0),
                            y: -100 + (animate ? geometry.size.height + 200 : 0)
                        )
                        .animation(
                            Animation.linear(duration: balloon.duration)
                                .delay(balloon.delay),
                            value: animate
                        )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear {
            generateBalloons()
            // Trigger animation after a brief delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                animate = true
            }
        }
    }

    func generateBalloons() {
        // Expanded color palette with many more variations
        let colors: [Color] = [
            // Reds
            Color(red: 1.0, green: 0.2, blue: 0.2),
            Color(red: 0.9, green: 0.3, blue: 0.3),
            Color(red: 1.0, green: 0.42, blue: 0.42),
            // Oranges
            Color(red: 1.0, green: 0.5, blue: 0.0),
            Color(red: 1.0, green: 0.65, blue: 0.0),
            Color(red: 1.0, green: 0.55, blue: 0.25),
            // Yellows
            Color(red: 1.0, green: 0.9, blue: 0.1),
            Color(red: 1.0, green: 0.9, blue: 0.43),
            Color(red: 0.95, green: 0.85, blue: 0.2),
            // Greens
            Color(red: 0.2, green: 0.8, blue: 0.2),
            Color(red: 0.3, green: 0.9, blue: 0.3),
            Color(red: 0.66, green: 0.9, blue: 0.81),
            Color(red: 0.58, green: 0.88, blue: 0.83),
            // Blues
            Color(red: 0.2, green: 0.6, blue: 1.0),
            Color(red: 0.31, green: 0.8, blue: 0.77),
            Color(red: 0.0, green: 0.5, blue: 1.0),
            Color(red: 0.4, green: 0.7, blue: 0.95),
            // Purples
            Color(red: 0.6, green: 0.4, blue: 0.9),
            Color(red: 0.7, green: 0.3, blue: 0.9),
            Color(red: 0.5, green: 0.2, blue: 0.8),
            // Pinks
            Color(red: 1.0, green: 0.4, blue: 0.7),
            Color(red: 1.0, green: 0.55, blue: 0.78),
            Color(red: 0.95, green: 0.5, blue: 0.85),
            Color(red: 1.0, green: 0.6, blue: 0.8),
        ]

        guard let screen = NSScreen.main else { return }
        let screenWidth = screen.frame.width

        // Increase to 50 balloons with more variety
        balloons = (0..<50).map { _ in
            Balloon(
                color: colors.randomElement()!,
                startX: CGFloat.random(in: 0...screenWidth),
                delay: Double.random(in: 0...2),
                duration: Double.random(in: 5...10),
                drift: CGFloat.random(in: -150...150),
                size: CGFloat.random(in: 0.6...1.5)  // Size variation from 60% to 150%
            )
        }
    }
}

struct BalloonShape: View {
    let color: Color
    let size: CGFloat

    var body: some View {
        // Simple balloon - just the body, no string
        ZStack {
            // Main balloon
            Ellipse()
                .fill(color)
                .frame(width: 60 * size, height: 80 * size)
                .overlay(
                    // Highlight
                    Ellipse()
                        .fill(Color.white.opacity(0.3))
                        .frame(width: 20 * size, height: 25 * size)
                        .offset(x: -10 * size, y: -15 * size)
                )

            // Small knot at bottom
            Circle()
                .fill(color.opacity(0.9))
                .frame(width: 8 * size, height: 8 * size)
                .offset(y: 40 * size)
        }
        .shadow(color: Color.black.opacity(0.2), radius: 4 * size, x: 2, y: 2)
    }
}

// Preview removed for command-line compilation
