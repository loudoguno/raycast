import SwiftUI

struct Star: Identifiable {
    let id = UUID()
    let startX: CGFloat
    let startY: CGFloat
    let endX: CGFloat
    let endY: CGFloat
    let delay: Double
    let brightness: Double
}

struct GalaxyView: View {
    @State private var stars: [Star] = []
    @State private var warp = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.black.opacity(0.85)  // Darker space background

                ForEach(stars) { star in
                    RoundedRectangle(cornerRadius: warp ? 2 : 1)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    Color.white.opacity(star.brightness),
                                    Color.blue.opacity(star.brightness * 0.5),
                                    Color.clear
                                ]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(
                            width: warp ? 300 : 3,  // Much longer streaks
                            height: warp ? 4 : 3
                        )
                        .position(
                            x: warp ? star.endX : star.startX,
                            y: warp ? star.endY : star.startY
                        )
                        .rotationEffect(.radians(atan2(star.endY - star.startY, star.endX - star.startX)))
                        .animation(
                            Animation.easeIn(duration: 2.0).delay(star.delay),
                            value: warp
                        )
                        .blur(radius: warp ? 2 : 0)
                }
            }
        }
        .onAppear {
            generateStars()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                warp = true
            }
        }
    }

    func generateStars() {
        guard let screen = NSScreen.main else { return }
        let screenWidth = screen.frame.width
        let screenHeight = screen.frame.height
        let centerX = screenWidth / 2
        let centerY = screenHeight / 2

        stars = (0..<300).map { _ in
            let startX = CGFloat.random(in: centerX - 200...centerX + 200)
            let startY = CGFloat.random(in: centerY - 200...centerY + 200)
            let angle = atan2(startY - centerY, startX - centerX)
            let distance: CGFloat = 3000

            return Star(
                startX: startX,
                startY: startY,
                endX: centerX + cos(angle) * distance,
                endY: centerY + sin(angle) * distance,
                delay: Double.random(in: 0...0.3),
                brightness: Double.random(in: 0.5...1.0)
            )
        }
    }
}
