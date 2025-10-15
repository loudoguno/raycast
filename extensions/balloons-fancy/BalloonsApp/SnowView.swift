import SwiftUI

struct Snowflake: Identifiable {
    let id = UUID()
    let startX: CGFloat
    let delay: Double
    let duration: Double
    let drift: CGFloat
    let size: CGFloat
    let rotation: Double
    let opacity: Double
}

struct SnowView: View {
    @State private var snowflakes: [Snowflake] = []
    @State private var animate = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.clear

                ForEach(snowflakes) { snowflake in
                    SnowflakeShape(size: snowflake.size)
                        .stroke(Color.white.opacity(snowflake.opacity), lineWidth: 2 * snowflake.size)
                        .frame(width: 20 * snowflake.size, height: 20 * snowflake.size)
                        .position(
                            x: snowflake.startX + (animate ? snowflake.drift : 0),
                            y: -50 + (animate ? geometry.size.height + 100 : 0)
                        )
                        .rotationEffect(.degrees(animate ? snowflake.rotation * 360 : 0))
                        .animation(
                            Animation.linear(duration: snowflake.duration)
                                .delay(snowflake.delay),
                            value: animate
                        )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear {
            generateSnowflakes()
            // Trigger animation after a brief delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                animate = true
            }
        }
    }

    func generateSnowflakes() {
        guard let screen = NSScreen.main else { return }
        let screenWidth = screen.frame.width

        // Generate 500-700 snowflakes for a COMPLETE WHITEOUT BLIZZARD! 💨❄️❄️❄️
        snowflakes = (0..<Int.random(in: 500...700)).map { _ in
            Snowflake(
                startX: CGFloat.random(in: -300...screenWidth + 300),
                delay: Double.random(in: 0...1.5),  // Continuous snow
                duration: Double.random(in: 3...7),  // Fast blizzard speed!
                drift: CGFloat.random(in: -400...400),  // EXTREME wind gusts!
                size: CGFloat.random(in: 0.3...2.0),  // Bigger flakes in storm
                rotation: Double.random(in: 3...8),  // Whipping rotation
                opacity: Double.random(in: 0.4...1.0)  // More opaque for whiteout
            )
        }
    }
}

struct SnowflakeShape: Shape {
    let size: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let armLength = 10 * size

        // Create 6 arms for the snowflake
        for i in 0..<6 {
            let angle = Double(i) * 60.0 * .pi / 180.0
            let endX = center.x + CGFloat(cos(angle)) * armLength
            let endY = center.y + CGFloat(sin(angle)) * armLength

            // Main arm
            path.move(to: center)
            path.addLine(to: CGPoint(x: endX, y: endY))

            // Small branches
            let branchLength = armLength * 0.3
            let branchAngle1 = angle - .pi / 4
            let branchAngle2 = angle + .pi / 4

            let branchX = center.x + CGFloat(cos(angle)) * armLength * 0.6
            let branchY = center.y + CGFloat(sin(angle)) * armLength * 0.6

            path.move(to: CGPoint(x: branchX, y: branchY))
            path.addLine(to: CGPoint(
                x: branchX + CGFloat(cos(branchAngle1)) * branchLength,
                y: branchY + CGFloat(sin(branchAngle1)) * branchLength
            ))

            path.move(to: CGPoint(x: branchX, y: branchY))
            path.addLine(to: CGPoint(
                x: branchX + CGFloat(cos(branchAngle2)) * branchLength,
                y: branchY + CGFloat(sin(branchAngle2)) * branchLength
            ))
        }

        return path
    }
}
