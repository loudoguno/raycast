import SwiftUI

struct Leaf: Identifiable {
    let id = UUID()
    let startX: CGFloat
    let delay: Double
    let duration: Double
    let drift: CGFloat
    let size: CGFloat
    let rotation: Double
    let color: Color
}

struct LeavesView: View {
    @State private var leaves: [Leaf] = []
    @State private var animate = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.clear

                ForEach(leaves) { leaf in
                    LeafShape(size: leaf.size)
                        .fill(leaf.color)
                        .position(
                            x: leaf.startX + (animate ? leaf.drift : 0),
                            y: -50 + (animate ? geometry.size.height + 50 : 0)
                        )
                        .rotationEffect(.degrees(animate ? leaf.rotation * 720 : 0))
                        .animation(
                            Animation.easeInOut(duration: leaf.duration)
                                .delay(leaf.delay),
                            value: animate
                        )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear {
            generateLeaves()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                animate = true
            }
        }
    }

    func generateLeaves() {
        let colors: [Color] = [
            Color(red: 0.8, green: 0.2, blue: 0.1),
            Color(red: 0.9, green: 0.3, blue: 0.1),
            Color(red: 0.95, green: 0.5, blue: 0.1),
            Color(red: 0.85, green: 0.6, blue: 0.1),
            Color(red: 0.7, green: 0.4, blue: 0.1),
            Color(red: 0.6, green: 0.3, blue: 0.1),
        ]

        guard let screen = NSScreen.main else { return }
        let screenWidth = screen.frame.width

        leaves = (0..<Int.random(in: 80...120)).map { _ in
            Leaf(
                startX: CGFloat.random(in: -200...screenWidth + 200),
                delay: Double.random(in: 0...4),
                duration: Double.random(in: 6...12),
                drift: CGFloat.random(in: -300...300),
                size: CGFloat.random(in: 0.8...1.8),
                rotation: Double.random(in: 2...5),
                color: colors.randomElement()!
            )
        }
    }
}

struct LeafShape: Shape {
    let size: CGFloat

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let width = 18 * size
        let height = 20 * size
        let center = CGPoint(x: rect.midX, y: rect.midY)

        path.move(to: CGPoint(x: center.x, y: center.y - height / 2))
        path.addQuadCurve(
            to: CGPoint(x: center.x, y: center.y + height / 2),
            control: CGPoint(x: center.x + width / 2, y: center.y)
        )
        path.addQuadCurve(
            to: CGPoint(x: center.x, y: center.y - height / 2),
            control: CGPoint(x: center.x - width / 2, y: center.y)
        )
        path.move(to: CGPoint(x: center.x, y: center.y - height / 2))
        path.addLine(to: CGPoint(x: center.x, y: center.y + height / 2))

        return path
    }
}
