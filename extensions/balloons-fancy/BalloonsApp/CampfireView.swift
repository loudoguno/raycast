import SwiftUI

struct Ember: Identifiable {
    let id = UUID()
    let color: Color
    let startX: CGFloat
    let delay: Double
    let duration: Double
    let drift: CGFloat
    let size: CGFloat
}

struct CampfireView: View {
    @State private var embers: [Ember] = []
    @State private var animate = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.clear

                ForEach(embers) { ember in
                    Circle()
                        .fill(
                            RadialGradient(
                                gradient: Gradient(colors: [ember.color, ember.color.opacity(0.3)]),
                                center: .center,
                                startRadius: 0,
                                endRadius: ember.size / 2
                            )
                        )
                        .frame(width: ember.size, height: ember.size)
                        .position(
                            x: ember.startX + (animate ? ember.drift : 0),
                            y: geometry.size.height + 50 - (animate ? geometry.size.height + 200 : 0)
                        )
                        .opacity(animate ? 0 : 1)
                        .animation(
                            Animation.easeOut(duration: ember.duration)
                                .delay(ember.delay),
                            value: animate
                        )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear {
            generateEmbers()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                animate = true
            }
        }
    }

    func generateEmbers() {
        let colors: [Color] = [
            Color(red: 1.0, green: 0.4, blue: 0.0),   // Bright Orange
            Color(red: 1.0, green: 0.5, blue: 0.0),   // Orange
            Color(red: 1.0, green: 0.6, blue: 0.0),   // Light Orange
            Color(red: 1.0, green: 0.7, blue: 0.2),   // Yellow-Orange
            Color(red: 1.0, green: 0.3, blue: 0.0),   // Deep Orange
            Color(red: 0.9, green: 0.2, blue: 0.0),   // Red-Orange
        ]

        guard let screen = NSScreen.main else { return }
        let screenWidth = screen.frame.width

        // Generate 150-200 glowing embers rising across ENTIRE bottom half
        embers = (0..<Int.random(in: 150...200)).map { _ in
            Ember(
                color: colors.randomElement()!,
                startX: CGFloat.random(in: screenWidth * 0.1...screenWidth * 0.9),  // WIDE spread!
                delay: Double.random(in: 0...2),
                duration: Double.random(in: 2...5),  // Faster rise for more action
                drift: CGFloat.random(in: -120...120),  // More sideways drift
                size: CGFloat.random(in: 3...10)  // Varied sizes
            )
        }
    }
}
