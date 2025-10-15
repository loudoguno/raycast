import { showHUD, open, environment } from "@raycast/api";
import fs from "fs";
import path from "path";
import os from "os";

export default async function Command() {
  // Create a temporary HTML file with the balloon animation
  const htmlContent = generateBalloonsHTML();
  const tmpDir = os.tmpdir();
  const htmlPath = path.join(tmpDir, `balloons-${Date.now()}.html`);

  // Write the HTML file
  fs.writeFileSync(htmlPath, htmlContent);

  // Open in default browser (will open in a new window/tab)
  await open(htmlPath);

  // Show HUD confirmation
  await showHUD("🎈 Balloons launched!");

  // Clean up after 10 seconds
  setTimeout(() => {
    try {
      fs.unlinkSync(htmlPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }, 10000);
}

function generateBalloonsHTML(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>🎈 Balloons!</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 48px;
      font-weight: bold;
      text-align: center;
      z-index: 1000;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      animation: fadeInOut 8s ease-in-out;
    }

    @keyframes fadeInOut {
      0%, 100% { opacity: 0; }
      10%, 90% { opacity: 1; }
    }

    .balloon-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      overflow: hidden;
    }

    @keyframes float-up {
      0% {
        transform: translateY(0) translateX(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(-120vh) translateX(var(--drift)) rotate(var(--rotation));
        opacity: 0;
      }
    }

    @keyframes sway {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(15px); }
    }

    .balloon {
      position: absolute;
      bottom: -150px;
      width: 60px;
      height: 80px;
      animation: float-up var(--duration) ease-in forwards;
      animation-delay: var(--delay);
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
    }

    .balloon-body {
      width: 60px;
      height: 80px;
      background: var(--color);
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      position: relative;
    }

    .balloon-body::before {
      content: '';
      position: absolute;
      width: 12px;
      height: 12px;
      background: var(--color);
      border-radius: 50%;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      filter: brightness(0.9);
    }

    .balloon-string {
      position: absolute;
      width: 2px;
      height: 100px;
      background: rgba(255, 255, 255, 0.6);
      top: 86px;
      left: 50%;
      transform-origin: top;
      animation: sway 2s ease-in-out infinite;
    }

    .balloon-highlight {
      position: absolute;
      width: 20px;
      height: 25px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      top: 12px;
      left: 15px;
    }

    .close-hint {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 14px;
      opacity: 0.7;
      z-index: 1001;
    }
  </style>
</head>
<body>
  <div class="message">🎈 Balloons! 🎈</div>
  <div class="balloon-container" id="container"></div>
  <div class="close-hint">This window will auto-close in 8 seconds</div>

  <script>
    const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#FF8DC7", "#A8E6CF", "#FFA07A", "#98D8C8"];
    const container = document.getElementById('container');

    // Generate 30 balloons
    for (let i = 0; i < 30; i++) {
      const balloon = document.createElement('div');
      balloon.className = 'balloon';

      const color = colors[Math.floor(Math.random() * colors.length)];
      const delay = Math.random() * 3;
      const duration = 8 + Math.random() * 4;
      const startX = Math.random() * 100;
      const drift = (Math.random() - 0.5) * 200;
      const rotation = (Math.random() - 0.5) * 60;

      balloon.style.left = startX + '%';
      balloon.style.setProperty('--duration', duration + 's');
      balloon.style.setProperty('--delay', delay + 's');
      balloon.style.setProperty('--drift', drift + 'px');
      balloon.style.setProperty('--rotation', rotation + 'deg');
      balloon.style.setProperty('--color', color);

      balloon.innerHTML = \`
        <div class="balloon-body">
          <div class="balloon-highlight"></div>
        </div>
        <div class="balloon-string"></div>
      \`;

      container.appendChild(balloon);
    }

    // Auto-close after 8 seconds
    setTimeout(() => {
      window.close();
    }, 8000);
  </script>
</body>
</html>`;
}
