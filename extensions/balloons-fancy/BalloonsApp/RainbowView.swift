import SwiftUI

struct RainbowView: View {
    @State private var opacity: Double = 0
    @State private var shimmer: Bool = false

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.clear

                // Rainbow arc with multiple bands for thickness
                ForEach(0..<7, id: \.self) { band in
                    RainbowShape()
                        .stroke(
                            getColorForBand(band),
                            lineWidth: 80
                        )
                        .frame(width: geometry.size.width * 0.9, height: geometry.size.height * 0.6)
                        .position(x: geometry.size.width / 2, y: geometry.size.height * 0.3)
                        .offset(y: CGFloat(band) * -15)
                        .opacity(opacity * (shimmer ? 0.85 : 1.0))
                }
            }
        }
        .onAppear {
            // Fade in
            withAnimation(.easeIn(duration: 1.5)) {
                opacity = 1.0
            }
            // Shimmer effect
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                withAnimation(.easeInOut(duration: 0.3).repeatCount(3, autoreverses: true)) {
                    shimmer = true
                }
            }
            // Fade out
            DispatchQueue.main.asyncAfter(deadline: .now() + 4.0) {
                withAnimation(.easeOut(duration: 1.5)) {
                    opacity = 0
                }
            }
        }
    }

    func getColorForBand(_ band: Int) -> Color {
        switch band {
        case 0: return .red
        case 1: return .orange
        case 2: return .yellow
        case 3: return .green
        case 4: return .blue
        case 5: return Color(red: 0.3, green: 0, blue: 0.5)  // Indigo
        case 6: return Color(red: 0.5, green: 0, blue: 0.5)  // Violet
        default: return .white
        }
    }
}

struct RainbowShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.addArc(
            center: CGPoint(x: rect.midX, y: rect.maxY),
            radius: rect.width / 2,
            startAngle: .degrees(180),
            endAngle: .degrees(0),
            clockwise: false
        )
        return path
    }
}
