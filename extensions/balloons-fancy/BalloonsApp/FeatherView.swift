import SwiftUI

struct Feather: Identifiable {
    let id = UUID()
    let startX: CGFloat
    let delay: Double
    let duration: Double
    let drift: CGFloat
    let size: CGFloat
    let rotation: Double
    let opacity: Double
    let color: Color
    let swayAmplitude: CGFloat
}

struct FeatherView: View {
    @State private var feathers: [Feather] = []
    @State private var animate = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.clear

                ForEach(feathers) { feather in
                    FeatherShape(size: feather.size)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    feather.color.opacity(feather.opacity),
                                    feather.color.opacity(feather.opacity * 0.7)
                                ]),
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        .position(
                            x: feather.startX + (animate ? sin(Double(animate ? 1 : 0) * .pi * 4) * feather.swayAmplitude + feather.drift : 0),
                            y: -80 + (animate ? geometry.size.height + 150 : 0)
                        )
                        .rotationEffect(.degrees(animate ? feather.rotation * 360 : 0))
                        .animation(
                            Animation.easeInOut(duration: feather.duration)
                                .delay(feather.delay),
                            value: animate
                        )
                        .shadow(color: Color.black.opacity(0.2), radius: 3, x: 0, y: 2)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear {
            generateFeathers()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                animate = true
            }
        }
    }

    func generateFeathers() {
        let colors: [Color] = [
            Color.white,
            Color(red: 0.98, green: 0.98, blue: 0.98),  // Pure white
            Color(red: 0.92, green: 0.92, blue: 0.88),  // Cream
            Color(red: 0.88, green: 0.85, blue: 0.80),  // Light tan
            Color(red: 0.85, green: 0.82, blue: 0.78),  // Beige
        ]

        guard let screen = NSScreen.main else { return }
        let screenWidth = screen.frame.width

        // 35-50 gentle feathers - fewer, more visible
        feathers = (0..<Int.random(in: 35...50)).map { _ in
            Feather(
                startX: CGFloat.random(in: -150...screenWidth + 150),
                delay: Double.random(in: 0...5),
                duration: Double.random(in: 12...20),  // VERY slow, peaceful fall
                drift: CGFloat.random(in: -250...250),  // Wide swaying drift
                size: CGFloat.random(in: 1.2...2.2),  // Larger, more visible
                rotation: Double.random(in: 1...3),  // Gentle spinning
                opacity: Double.random(in: 0.7...0.95),
                color: colors.randomElement()!,
                swayAmplitude: CGFloat.random(in: 30...80)  // Side-to-side sway
            )
        }
    }
}

struct FeatherShape: Shape {
    let size: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let width = 12 * size
        let height = 35 * size
        let center = CGPoint(x: rect.midX, y: rect.midY)

        // Central quill (thicker)
        path.move(to: CGPoint(x: center.x, y: center.y - height / 2))
        path.addLine(to: CGPoint(x: center.x, y: center.y + height / 2))

        // Left vane - curved barbs
        for i in stride(from: 0, through: 12, by: 1) {
            let t = CGFloat(i) / 12.0
            let y = center.y - height / 2 + t * height
            // Curve gets narrower toward tip
            let curveWidth = width * (1.0 - t * 0.7) * 0.65
            let x = center.x - curveWidth

            path.move(to: CGPoint(x: center.x, y: y))
            path.addQuadCurve(
                to: CGPoint(x: x, y: y + 3),
                control: CGPoint(x: center.x - curveWidth * 0.5, y: y + 1.5)
            )
        }

        // Right vane - curved barbs
        for i in stride(from: 0, through: 12, by: 1) {
            let t = CGFloat(i) / 12.0
            let y = center.y - height / 2 + t * height
            let curveWidth = width * (1.0 - t * 0.7) * 0.65
            let x = center.x + curveWidth

            path.move(to: CGPoint(x: center.x, y: y))
            path.addQuadCurve(
                to: CGPoint(x: x, y: y + 3),
                control: CGPoint(x: center.x + curveWidth * 0.5, y: y + 1.5)
            )
        }

        return path
    }
}
