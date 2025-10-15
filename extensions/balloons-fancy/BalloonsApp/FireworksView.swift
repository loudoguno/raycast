import SwiftUI
import AVFoundation

struct Firework: Identifiable {
    let id = UUID()
    let startX: CGFloat
    let startY: CGFloat
    let delay: Double
    let particles: [FireworkParticle]
}

struct FireworkParticle: Identifiable {
    let id = UUID()
    let color: Color
    let angle: Double
    let speed: Double
    let size: CGFloat
}

struct FireworksView: View {
    @State private var fireworks: [Firework] = []
    @State private var animate = false
    private var audioPlayer: AVAudioPlayer?

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.clear

                ForEach(fireworks) { firework in
                    ForEach(firework.particles) { particle in
                        Circle()
                            .fill(particle.color)
                            .frame(width: particle.size, height: particle.size)
                            .position(
                                x: firework.startX + (animate ? CGFloat(cos(particle.angle) * particle.speed * 350) : 0),
                                y: firework.startY + (animate ? CGFloat(sin(particle.angle) * particle.speed * 350) : 0)
                            )
                            .opacity(animate ? 0 : 1)
                            .animation(
                                Animation.easeOut(duration: 2.0)
                                    .delay(firework.delay),
                                value: animate
                            )
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear {
            generateFireworks()
            playFireworkSounds()
            // Trigger animation after a brief delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                animate = true
            }
        }
    }

    func generateFireworks() {
        let colors: [Color] = [
            // Vibrant firework colors
            Color(red: 1.0, green: 0.2, blue: 0.2),   // Red
            Color(red: 1.0, green: 0.5, blue: 0.0),   // Orange
            Color(red: 1.0, green: 0.9, blue: 0.1),   // Yellow
            Color(red: 0.2, green: 1.0, blue: 0.2),   // Green
            Color(red: 0.2, green: 0.6, blue: 1.0),   // Blue
            Color(red: 0.6, green: 0.2, blue: 1.0),   // Purple
            Color(red: 1.0, green: 0.4, blue: 0.7),   // Pink
            Color(red: 1.0, green: 1.0, blue: 1.0),   // White
            Color(red: 0.0, green: 1.0, blue: 1.0),   // Cyan
            Color(red: 1.0, green: 0.65, blue: 0.0),  // Gold
        ]

        guard let screen = NSScreen.main else { return }
        let screenWidth = screen.frame.width
        let screenHeight = screen.frame.height

        // Generate 20-25 fireworks for more spectacle!
        fireworks = (0..<Int.random(in: 20...25)).map { _ in
            // Random position in upper 2/3 of screen
            let x = CGFloat.random(in: screenWidth * 0.2...screenWidth * 0.8)
            let y = CGFloat.random(in: screenHeight * 0.2...screenHeight * 0.6)

            // Each firework has 80-120 particles for BIGGER explosions!
            let particleCount = Int.random(in: 80...120)
            let fireworkColor = colors.randomElement()!

            // Create particles radiating in all directions
            let particles = (0..<particleCount).map { i -> FireworkParticle in
                let angle = Double(i) * (2 * .pi / Double(particleCount)) + Double.random(in: -0.2...0.2)
                let speed = Double.random(in: 0.8...1.5)
                let size = CGFloat.random(in: 5...12)

                // Use same color or slight variation
                let particleColor: Color
                if Bool.random() {
                    particleColor = fireworkColor
                } else {
                    particleColor = colors.randomElement()!
                }

                return FireworkParticle(
                    color: particleColor,
                    angle: angle,
                    speed: speed,
                    size: size
                )
            }

            return Firework(
                startX: x,
                startY: y,
                delay: Double.random(in: 0...2),
                particles: particles
            )
        }
    }

    func playFireworkSounds() {
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
