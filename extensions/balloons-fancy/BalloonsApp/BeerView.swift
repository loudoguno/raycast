import SwiftUI

struct Bubble: Identifiable {
    let id = UUID()
    let startX: CGFloat
    let startY: CGFloat
    let delay: Double
    let duration: Double
    let size: CGFloat
    let drift: CGFloat
}

struct BeerView: View {
    @State private var fillHeight: CGFloat = 0
    @State private var bubbles: [Bubble] = []
    @State private var foamBubbles: [Bubble] = []
    @State private var animate = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.clear

                // Beer liquid rising
                Rectangle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.95, green: 0.7, blue: 0.1),  // Golden beer
                                Color(red: 0.9, green: 0.65, blue: 0.05)   // Amber
                            ]),
                            startPoint: .bottom,
                            endPoint: .top
                        )
                    )
                    .frame(height: animate ? geometry.size.height * 0.85 : 0)
                    .position(x: geometry.size.width / 2, y: geometry.size.height - (animate ? geometry.size.height * 0.85 / 2 : 0))
                    .animation(Animation.easeOut(duration: 3.0), value: animate)

                // Bubbles rising through beer
                ForEach(bubbles) { bubble in
                    Circle()
                        .fill(Color.white.opacity(0.4))
                        .frame(width: bubble.size, height: bubble.size)
                        .position(
                            x: bubble.startX + (animate ? bubble.drift : 0),
                            y: bubble.startY - (animate ? geometry.size.height * 0.6 : 0)
                        )
                        .opacity(animate ? 0 : 1)
                        .animation(
                            Animation.linear(duration: bubble.duration)
                                .delay(bubble.delay),
                            value: animate
                        )
                }

                // Foam head on top
                Rectangle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color.white.opacity(0.95),
                                Color(red: 0.98, green: 0.96, blue: 0.9).opacity(0.9)
                            ]),
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(height: animate ? geometry.size.height * 0.15 : 0)
                    .position(
                        x: geometry.size.width / 2,
                        y: animate ? geometry.size.height * 0.15 / 2 : 0
                    )
                    .animation(Animation.easeOut(duration: 1.5).delay(3.0), value: animate)

                // Foam bubbles
                ForEach(foamBubbles) { bubble in
                    Circle()
                        .fill(Color.white.opacity(0.7))
                        .frame(width: bubble.size, height: bubble.size)
                        .position(
                            x: bubble.startX,
                            y: bubble.startY
                        )
                        .opacity(animate ? 1 : 0)
                        .animation(
                            Animation.easeIn(duration: 0.5)
                                .delay(bubble.delay + 3.0),
                            value: animate
                        )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(Color.clear)
        .onAppear {
            generateBubbles()
            generateFoamBubbles()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                animate = true
            }
        }
    }

    func generateBubbles() {
        guard let screen = NSScreen.main else { return }
        let screenWidth = screen.frame.width
        let screenHeight = screen.frame.height

        // 200-300 bubbles rising through the beer
        bubbles = (0..<Int.random(in: 200...300)).map { _ in
            Bubble(
                startX: CGFloat.random(in: 0...screenWidth),
                startY: screenHeight - CGFloat.random(in: 100...500),
                delay: Double.random(in: 0...2.5),
                duration: Double.random(in: 2...4),
                size: CGFloat.random(in: 3...8),
                drift: CGFloat.random(in: -30...30)
            )
        }
    }

    func generateFoamBubbles() {
        guard let screen = NSScreen.main else { return }
        let screenWidth = screen.frame.width
        let screenHeight = screen.frame.height

        // 100-150 foam bubbles at the top
        foamBubbles = (0..<Int.random(in: 100...150)).map { _ in
            Bubble(
                startX: CGFloat.random(in: 0...screenWidth),
                startY: screenHeight * CGFloat.random(in: 0.05...0.15),
                delay: Double.random(in: 0...1),
                duration: 0.5,
                size: CGFloat.random(in: 8...20),
                drift: 0
            )
        }
    }
}
