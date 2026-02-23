import { exec } from "child_process";
import { environment } from "@raycast/api";
import path from "path";
import { getWordList, WordSet } from "./words";

export function generateTest(wordCount: number, wordSet: WordSet): string[] {
  const words = getWordList(wordSet);
  const result: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    result.push(words[Math.floor(Math.random() * words.length)]);
  }
  return result;
}

export function calculateWPM(startTime: number, endTime: number, charCount: number): number {
  const minutes = (endTime - startTime) / 60000;
  if (minutes <= 0 || charCount < 5) return 0;
  return Math.round(charCount / 5 / minutes);
}

export function calculateAccuracy(totalChars: number, totalErrors: number): number {
  if (totalChars === 0) return 100;
  return Math.max(0, Math.round(((totalChars - totalErrors) / totalChars) * 100));
}

export function getWPMRating(wpm: number): { label: string; emoji: string } {
  if (wpm >= 100) return { label: "Blazing Fast", emoji: "🔥" };
  if (wpm >= 80) return { label: "Excellent", emoji: "⚡" };
  if (wpm >= 60) return { label: "Great", emoji: "🚀" };
  if (wpm >= 40) return { label: "Good", emoji: "👍" };
  if (wpm >= 25) return { label: "Average", emoji: "📝" };
  return { label: "Keep Practicing", emoji: "💪" };
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Sound system - uses macOS system sounds + bundled assets via afplay
// ScreenReader ClickFast is a crisp 60ms click perfect for keystroke feedback
const SYSTEM_CLICK = "/System/Library/PrivateFrameworks/ScreenReader.framework/Versions/A/Resources/Sounds/ClickFast.aiff";

function assetPath(filename: string): string {
  return path.join(environment.assetsPath, filename);
}

const SOUNDS = {
  // Per-keystroke tick: crisp system click (60ms, satisfying mechanical feel)
  keystroke: SYSTEM_CLICK,
  // Error: short dissonant buzz from bundled asset (40ms)
  error: () => assetPath("key_error.aiff"),
  // Word complete: soft pop
  wordComplete: "/System/Library/Sounds/Pop.aiff",
  // Test complete: triumphant glass
  testComplete: "/System/Library/Sounds/Glass.aiff",
} as const;

// Per-sound-type cooldowns to prevent overlap while allowing different sounds simultaneously
const lastSoundTimes: Record<string, number> = {};
const COOLDOWNS: Record<string, number> = {
  keystroke: 30, // fast typists need minimal cooldown
  error: 60,
  wordComplete: 100,
  testComplete: 0,
};

export function playSound(sound: keyof typeof SOUNDS, volume = 0.5): void {
  const now = Date.now();
  const lastTime = lastSoundTimes[sound] || 0;
  const cooldown = COOLDOWNS[sound] || 50;

  if (now - lastTime < cooldown) return;
  lastSoundTimes[sound] = now;

  const soundPath = typeof SOUNDS[sound] === "function" ? (SOUNDS[sound] as () => string)() : SOUNDS[sound];
  exec(`/usr/bin/afplay "${soundPath}" -v ${volume}`);
}
