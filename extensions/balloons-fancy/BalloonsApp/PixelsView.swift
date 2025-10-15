import SwiftUI

struct Invader: Identifiable {
    let id = UUID()
    let startX: CGFloat
    let startY: CGFloat
    let delay: Double
    let row: Int
}

struct PixelsView: View {
    @State private var invaders: [Invader] = []
    @State private var animate = false
    @State private var sideOffset: CGFloat = 0

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.black.opacity(0.7)

                ForEach(invaders) { invader in
                    Text("👾")
                        .font(.system(size: 40))
                        .position(
                            x: invader.startX + (animate ? sideOffset : 0),
                            y: invader.startY + (animate ? geometry.size.height + 100 : 0)
                        )
                        .animation(
                            Animation.linear(duration: 8.0).delay(invader.delay),
                            value: animate
                        )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear {
            generateInvaders()
            startAnimation()
        }
    }

    func generateInvaders() {
        guard let screen = NSScreen.main else { return }
        let screenWidth = screen.frame.width

        // Create rows of invaders like Space Invaders
        var invaderArray: [Invader] = []
        let columns = 10
        let rows = 4
        let spacing: CGFloat = 80
        let startX = (screenWidth - CGFloat(columns - 1) * spacing) / 2

        for row in 0..<rows {
            for col in 0..<columns {
                invaderArray.append(Invader(
                    startX: startX + CGFloat(col) * spacing,
                    startY: -100 - CGFloat(row * 60),  // Stagger rows vertically
                    delay: Double(row) * 0.3 + Double.random(in: 0...0.2),
                    row: row
                ))
            }
        }

        invaders = invaderArray
    }

    func startAnimation() {
        // Start downward movement
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            animate = true
        }

        // Add side-to-side movement like Space Invaders
        var direction: CGFloat = 30
        Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { timer in
            withAnimation(.linear(duration: 0.5)) {
                sideOffset += direction
                if abs(sideOffset) > 150 {
                    direction = -direction
                }
            }

            // Stop timer after 8 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 8.0) {
                timer.invalidate()
            }
        }
    }
}
