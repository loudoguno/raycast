import SwiftUI
import AVFoundation

struct Cupcake: Identifiable {
    let id = UUID()
    let startX: CGFloat
    let startY: CGFloat
    let delay: Double
    let particles: [CupcakeParticle]
}

struct CupcakeParticle: Identifiable {
    let id = UUID()
    let color: Color
    let angle: Double
    let speed: Double
    let size: CGFloat
}

struct CupcakeView: View {
    @State private var cupcakes: [Cupcake] = []
    @State private var animate = false
    private var audioPlayer: AVAudioPlayer?

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.clear

                ForEach(cupcakes) { cupcake in
                    ForEach(cupcake.particles) { particle in
                        Circle()
                            .fill(particle.color)
                            .frame(width: particle.size, height: particle.size)
                            .position(
                                x: cupcake.startX + (animate ? CGFloat(cos(particle.angle) * particle.speed * 350) : 0),
                                y: cupcake.startY + (animate ? CGFloat(sin(particle.angle) * particle.speed * 350) : 0)
                            )
                            .opacity(animate ? 0 : 1)
                            .animation(
                                Animation.easeOut(duration: 2.0)
                                    .delay(cupcake.delay),
                                value: animate
                            )
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear {
            generateCupcakes()
            playCupcakeSounds()
            // Trigger animation after a brief delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                animate = true
            }
        }
    }

    func generateCupcakes() {
        let colors: [Color] = [
            // Pastel cupcake frosting colors!
            Color(red: 1.0, green: 0.7, blue: 0.8),   // Pastel Pink
            Color(red: 0.7, green: 0.9, blue: 1.0),   // Baby Blue
            Color(red: 0.9, green: 0.8, blue: 1.0),   // Lavender
            Color(red: 1.0, green: 0.9, blue: 0.7),   // Cream
            Color(red: 0.8, green: 1.0, blue: 0.8),   // Mint Green
            Color(red: 1.0, green: 0.85, blue: 0.7),  // Peach
            Color(red: 0.95, green: 0.8, blue: 0.9),  // Rose
            Color(red: 0.85, green: 0.9, blue: 1.0),  // Periwinkle
            Color(red: 1.0, green: 0.8, blue: 0.9),   // Cotton Candy
            Color(red: 0.9, green: 0.95, blue: 0.8),  // Lemon Cream
        ]

        guard let screen = NSScreen.main else { return }
        let screenWidth = screen.frame.width
        let screenHeight = screen.frame.height

        // Generate 20-25 cupcake explosions!
        cupcakes = (0..<Int.random(in: 20...25)).map { _ in
            // Random position in upper 2/3 of screen
            let x = CGFloat.random(in: screenWidth * 0.2...screenWidth * 0.8)
            let y = CGFloat.random(in: screenHeight * 0.2...screenHeight * 0.6)

            // Each cupcake has 80-120 frosting particles!
            let particleCount = Int.random(in: 80...120)
            let cupcakeColor = colors.randomElement()!

            // Create particles radiating in all directions
            let particles = (0..<particleCount).map { i -> CupcakeParticle in
                let angle = Double(i) * (2 * .pi / Double(particleCount)) + Double.random(in: -0.2...0.2)
                let speed = Double.random(in: 0.8...1.5)
                let size = CGFloat.random(in: 5...12)

                // Use same color or slight variation
                let particleColor: Color
                if Bool.random() {
                    particleColor = cupcakeColor
                } else {
                    particleColor = colors.randomElement()!
                }

                return CupcakeParticle(
                    color: particleColor,
                    angle: angle,
                    speed: speed,
                    size: size
                )
            }

            return Cupcake(
                startX: x,
                startY: y,
                delay: Double.random(in: 0...2),
                particles: particles
            )
        }
    }

    func playCupcakeSounds() {
        // Play system sound effects for fireworks
        // We'll use NSSound for built-in macOS sounds

        // Schedule multiple "pop" sounds at different delays to simulate fireworks
        for i in 0..<5 {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.4) {
                NSSound(named: "Pop")?.play()
            }
        }

        // Add some variety with "Funk" sound
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            NSSound(named: "Funk")?.play()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            NSSound(named: "Funk")?.play()
        }
    }
}
