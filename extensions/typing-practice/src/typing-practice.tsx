import { List, ActionPanel, Action, Icon, Color, open } from "@raycast/api";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { generateTest, calculateWPM, calculateAccuracy, getWPMRating, formatTime, playSound } from "./utils";
import { WordSet } from "./words";

type GameState = "idle" | "running" | "finished";

const WORD_COUNTS = ["10", "25", "50", "100"] as const;

export default function TypingPractice() {
  const [wordCount, setWordCount] = useState<string>("25");
  const [wordSet, setWordSet] = useState<WordSet>("common");
  const [words, setWords] = useState<string[]>(() => generateTest(25, "common"));
  const [typedText, setTypedText] = useState("");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [searchText, setSearchText] = useState("");
  const [tick, setTick] = useState(0);

  const startTimeRef = useRef<number>(0);
  const endTimeRef = useRef<number>(0);
  const totalErrorsRef = useRef<number>(0);
  const currentErrorsRef = useRef<number>(0);
  const prevTypedLenRef = useRef<number>(0);

  const targetText = useMemo(() => words.join(" "), [words]);

  // Live WPM timer
  useEffect(() => {
    if (gameState !== "running") return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const resetGame = useCallback(
    (count?: number, set?: WordSet) => {
      const c = count ?? parseInt(wordCount);
      const s = set ?? wordSet;
      setWords(generateTest(c, s));
      setTypedText("");
      setGameState("idle");
      setSearchText("");
      setTick(0);
      startTimeRef.current = 0;
      endTimeRef.current = 0;
      totalErrorsRef.current = 0;
      currentErrorsRef.current = 0;
      prevTypedLenRef.current = 0;
    },
    [wordCount, wordSet],
  );

  const handleTextChange = useCallback(
    (text: string) => {
      if (gameState === "finished") return;

      setSearchText(text);
      if (text.length === 0) return;

      if (gameState === "idle") {
        setGameState("running");
        startTimeRef.current = Date.now();
      }

      const prevLen = prevTypedLenRef.current;
      const isNewChar = text.length > prevLen;

      if (isNewChar && text.length <= targetText.length) {
        const lastIdx = text.length - 1;
        if (text[lastIdx] !== targetText[lastIdx]) {
          // Error keystroke
          totalErrorsRef.current++;
          playSound("error", 0.35);
        } else if (targetText[lastIdx] === " ") {
          // Word boundary - satisfying pop
          playSound("wordComplete", 0.3);
        } else {
          // Correct keystroke - satisfying tick
          playSound("keystroke", 0.15);
        }
      }

      prevTypedLenRef.current = text.length;
      setTypedText(text);

      // Count current errors
      let errors = 0;
      for (let i = 0; i < text.length && i < targetText.length; i++) {
        if (text[i] !== targetText[i]) errors++;
      }
      currentErrorsRef.current = errors;

      // Check if finished
      if (text.length >= targetText.length) {
        endTimeRef.current = Date.now();
        setGameState("finished");

        const isPerfect = totalErrorsRef.current === 0;
        if (isPerfect) {
          // Perfect score - let confetti handle its own "Yay!" sound
          setTimeout(() => open("raycast://confetti"), 150);
        } else {
          playSound("testComplete", 0.5);
        }
      }
    },
    [gameState, targetText],
  );

  const handleWordCountChange = useCallback(
    (newCount: string) => {
      setWordCount(newCount);
      resetGame(parseInt(newCount), wordSet);
    },
    [resetGame, wordSet],
  );

  const toggleWordSet = useCallback(() => {
    const newSet: WordSet = wordSet === "common" ? "code" : "common";
    setWordSet(newSet);
    resetGame(parseInt(wordCount), newSet);
  }, [wordSet, wordCount, resetGame]);

  // Calculate stats
  void tick;
  const now = Date.now();
  const elapsed =
    gameState === "finished"
      ? endTimeRef.current - startTimeRef.current
      : gameState === "running"
        ? now - startTimeRef.current
        : 0;

  const wpm =
    gameState === "finished"
      ? calculateWPM(startTimeRef.current, endTimeRef.current, typedText.length)
      : gameState === "running"
        ? calculateWPM(startTimeRef.current, now, typedText.length)
        : 0;

  const accuracy = calculateAccuracy(typedText.length, totalErrorsRef.current);
  const rating = getWPMRating(wpm);
  const progress = targetText.length > 0 ? Math.round((typedText.length / targetText.length) * 100) : 0;
  const wordsTyped = typedText.split(" ").length - (typedText.endsWith(" ") ? 0 : 1);
  const totalWords = words.length;
  const isPerfect = gameState === "finished" && totalErrorsRef.current === 0;

  const markdown = buildMarkdown(targetText, typedText, gameState, wpm, accuracy, rating, elapsed, wordsTyped, totalWords, isPerfect);

  const metadata =
    gameState !== "idle" ? (
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label title="WPM" text={`${wpm}`} icon={Icon.Gauge} />
        <List.Item.Detail.Metadata.Label
          title="Accuracy"
          text={`${accuracy}%`}
          icon={{
            source: Icon.BullsEye,
            tintColor: accuracy >= 95 ? Color.Green : accuracy >= 80 ? Color.Yellow : Color.Red,
          }}
        />
        <List.Item.Detail.Metadata.Label title="Time" text={formatTime(elapsed)} icon={Icon.Clock} />
        <List.Item.Detail.Metadata.Separator />
        <List.Item.Detail.Metadata.Label title="Progress" text={`${Math.min(typedText.length, targetText.length)} / ${targetText.length}`} />
        <List.Item.Detail.Metadata.Label title="Words" text={`${Math.min(wordsTyped, totalWords)} / ${totalWords}`} />
        <List.Item.Detail.Metadata.Label
          title="Errors"
          text={`${totalErrorsRef.current} total (${currentErrorsRef.current} current)`}
          icon={{ source: Icon.XMarkCircle, tintColor: totalErrorsRef.current > 0 ? Color.Red : Color.Green }}
        />
        <List.Item.Detail.Metadata.Separator />
        <List.Item.Detail.Metadata.Label title="Mode" text={wordSet === "code" ? "Code Words" : "Common Words"} />
        {gameState === "finished" && (
          <List.Item.Detail.Metadata.TagList title="Rating">
            <List.Item.Detail.Metadata.TagList.Item
              text={`${rating.emoji} ${rating.label}`}
              color={isPerfect ? Color.Green : wpm >= 60 ? Color.Green : wpm >= 40 ? Color.Yellow : Color.Orange}
            />
          </List.Item.Detail.Metadata.TagList>
        )}
      </List.Item.Detail.Metadata>
    ) : undefined;

  const actions = (
    <ActionPanel>
      <Action title="Restart Test" icon={Icon.RotateAntiClockwise} shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={() => resetGame()} />
      <Action
        title={`Switch to ${wordSet === "common" ? "Code" : "Common"} Words`}
        icon={Icon.Switch}
        shortcut={{ modifiers: ["cmd"], key: "t" }}
        onAction={toggleWordSet}
      />
    </ActionPanel>
  );

  return (
    <List
      isShowingDetail
      searchText={searchText}
      onSearchTextChange={handleTextChange}
      filtering={false}
      throttle={false}
      searchBarPlaceholder={gameState === "finished" ? "Done! Cmd+R to restart" : "Start typing to begin the test..."}
      searchBarAccessory={
        <List.Dropdown tooltip="Word Count" value={wordCount} onChange={handleWordCountChange}>
          {WORD_COUNTS.map((count) => (
            <List.Dropdown.Item key={count} title={`${count} words`} value={count} />
          ))}
        </List.Dropdown>
      }
    >
      <List.Item title="" detail={<List.Item.Detail markdown={markdown} metadata={metadata} />} actions={actions} />
    </List>
  );
}

function buildMarkdown(
  target: string,
  typed: string,
  state: GameState,
  wpm: number,
  accuracy: number,
  rating: { label: string; emoji: string },
  elapsed: number,
  wordsTyped: number,
  totalWords: number,
  isPerfect: boolean,
): string {
  if (state === "idle") {
    return [
      "# Typing Practice",
      "",
      "Start typing in the search bar above. Timer begins on your first keystroke.",
      "",
      "---",
      "",
      target,
      "",
      "---",
      "",
      `*${target.length} characters · ${totalWords} words · Cmd+T to switch mode · Cmd+R to restart*`,
    ].join("\n");
  }

  const cursorPos = Math.min(typed.length, target.length);
  const before = target.substring(0, cursorPos);
  const after = target.substring(cursorPos);

  // Error markers under the text
  let errorLine = "";
  let hasErrors = false;
  for (let i = 0; i < cursorPos; i++) {
    if (typed[i] !== target[i]) {
      errorLine += "^";
      hasErrors = true;
    } else {
      errorLine += " ";
    }
  }

  const cursorChar = "▌";
  const displayText = before + cursorChar + after;

  // Progress bar
  const barLen = 36;
  const filled = Math.round((cursorPos / target.length) * barLen);
  const progressBar = "█".repeat(filled) + "░".repeat(barLen - filled);

  if (state === "finished") {
    const header = isPerfect ? "# 🎉 Perfect Score!" : `# ${rating.emoji} Test Complete!`;

    const lines = [header, ""];

    if (isPerfect) {
      lines.push("**Flawless! Not a single mistake!**");
      lines.push("");
    }

    lines.push("```");
    lines.push(target);
    if (hasErrors) lines.push(errorLine.trimEnd());
    lines.push("```");
    lines.push("");
    lines.push(`\`${progressBar}\` **100%**`);
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push(`## ${wpm} WPM`);
    lines.push("");
    lines.push(`**${accuracy}%** accuracy · **${formatTime(elapsed)}** · ${totalWords} words`);
    lines.push("");
    lines.push(`*${rating.label} · Press Cmd+R to try again*`);

    return lines.join("\n");
  }

  // Running state
  const lines = ["```", displayText];
  if (hasErrors) lines.push(errorLine.trimEnd());
  lines.push("```");
  lines.push("");
  lines.push(`\`${progressBar}\` ${Math.min(cursorPos, target.length)}/${target.length}`);

  return lines.join("\n");
}
