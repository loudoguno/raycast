import type { TabAccessor } from "./strategies/browser";

// --- Handler config types ---

interface BrowserHandler {
  strategy: "browser";
  tabAccessor: TabAccessor;
}

interface AppleScriptHandler {
  strategy: "applescript";
  script: string;
}

interface AccessibilityHandler {
  strategy: "accessibility";
}

interface MenuCommandHandler {
  strategy: "menu-command";
  menuPath: string[];
  titleSource: "windowTitle" | "clipboard";
  delay?: number;
}

interface ShellHandler {
  strategy: "shell";
  command: string;
}

export type HandlerConfig =
  | BrowserHandler
  | AppleScriptHandler
  | AccessibilityHandler
  | MenuCommandHandler
  | ShellHandler;

// --- Handler registry ---

export const handlers: Record<string, HandlerConfig> = {
  // ─── Browsers ───────────────────────────────────────────
  "com.apple.Safari": { strategy: "browser", tabAccessor: "currentTab" },
  "com.google.Chrome": { strategy: "browser", tabAccessor: "activeTab" },
  "com.microsoft.edgemac": { strategy: "browser", tabAccessor: "activeTab" },
  "com.vivaldi.Vivaldi": { strategy: "browser", tabAccessor: "activeTab" },
  "com.kagi.kagimacOS": { strategy: "browser", tabAccessor: "currentTab" },
  "com.operasoftware.Opera": { strategy: "browser", tabAccessor: "activeTab" },
  "org.mozilla.firefox": { strategy: "browser", tabAccessor: "activeTab" },
  "company.thebrowser.Browser": {
    strategy: "browser",
    tabAccessor: "activeTab",
  },

  // ─── Tier 1: Daily Use ──────────────────────────────────
  "com.apple.finder": { strategy: "applescript", script: "finder.applescript" },
  "md.obsidian": { strategy: "applescript", script: "obsidian.applescript" },
  "com.omnigroup.OmniFocus4": {
    strategy: "applescript",
    script: "omnifocus.applescript",
  },
  "net.shinyfrog.bear": { strategy: "applescript", script: "bear.applescript" },
  "com.agiletortoise.Drafts-OSX": {
    strategy: "applescript",
    script: "drafts.applescript",
  },
  "com.culturedcode.ThingsMac": {
    strategy: "menu-command",
    menuPath: ["Edit", "Share", "Copy Link"],
    titleSource: "windowTitle",
    delay: 300,
  },
  "com.apple.mail": { strategy: "applescript", script: "mail.applescript" },
  "com.apple.TextEdit": {
    strategy: "applescript",
    script: "textedit.applescript",
  },
  "com.mitchellh.ghostty": { strategy: "accessibility" },
  "com.microsoft.VSCode": { strategy: "accessibility" },
  "com.anthropic.claudefordesktop": { strategy: "accessibility" },

  // ─── Tier 2: Regular Use ────────────────────────────────
  "com.apple.iCal": { strategy: "applescript", script: "calendar.applescript" },
  "com.apple.AddressBook": {
    strategy: "applescript",
    script: "contacts.applescript",
  },
  "com.flexibits.fantastical2.mac": {
    strategy: "applescript",
    script: "fantastical.applescript",
  },
  "com.spotify.client": {
    strategy: "applescript",
    script: "spotify.applescript",
  },
  "com.devon-technologies.think3": {
    strategy: "applescript",
    script: "devonthink.applescript",
  },
  "com.hogbaysoftware.Bike": {
    strategy: "applescript",
    script: "bike.applescript",
  },
  "com.apple.Notes": { strategy: "applescript", script: "notes.applescript" },
  "com.apple.Preview": {
    strategy: "applescript",
    script: "preview.applescript",
  },
  "com.apple.Terminal": { strategy: "accessibility" },
  "com.apptorium.SideNotes": { strategy: "accessibility" },
  "com.notion.id": { strategy: "accessibility" },
  "notion.id": { strategy: "accessibility" },

  // ─── Tier 3: Carried from KM ───────────────────────────
  "com.literatureandlatte.scrivener3": {
    strategy: "applescript",
    script: "scrivener.applescript",
  },
  "com.ulyssesapp.mac": {
    strategy: "applescript",
    script: "ulysses.applescript",
  },
  "com.panic.Nova": { strategy: "applescript", script: "nova.applescript" },
  "com.panic.Transmit": {
    strategy: "applescript",
    script: "transmit.applescript",
  },
  "com.reederapp.macOS": {
    strategy: "applescript",
    script: "reeder.applescript",
  },
  "com.sonnysoftware.bookends": {
    strategy: "applescript",
    script: "bookends.applescript",
  },
  "de.zettelkasten.TheArchive": {
    strategy: "applescript",
    script: "thearchive.applescript",
  },
  "com.multimarkdown.nvUltra": {
    strategy: "applescript",
    script: "nvultra.applescript",
  },
  "com.amazon.Kindle": {
    strategy: "applescript",
    script: "kindle.applescript",
  },
  "com.houdah.HoudahSpot4": {
    strategy: "applescript",
    script: "houdahspot.applescript",
  },
  "com.OakTree.Accordance": {
    strategy: "applescript",
    script: "accordance.applescript",
  },
  "com.stairways.keyboardmaestro.editor": {
    strategy: "applescript",
    script: "keyboardmaestro.applescript",
  },
  "com.toketaware.ithoughtsx": {
    strategy: "applescript",
    script: "ithoughts.applescript",
  },
  "app.soulver.mac": { strategy: "applescript", script: "soulver.applescript" },
  "com.evernote.Evernote": {
    strategy: "applescript",
    script: "evernote.applescript",
  },
  "com.omnigroup.OmniOutliner5": {
    strategy: "applescript",
    script: "omnioutliner.applescript",
  },
  "com.omnigroup.OmniPlan4": {
    strategy: "applescript",
    script: "omniplan.applescript",
  },
  "QReader.MarginStudyMac": {
    strategy: "applescript",
    script: "marginnote.applescript",
  },
  "com.lukilabs.lukiapp": { strategy: "accessibility" },
  "com.cocoatech.PathFinder": {
    strategy: "applescript",
    script: "pathfinder.applescript",
  },

  // ─── Hookmark-inspired additions ────────────────────────
  "com.apple.reminders": {
    strategy: "applescript",
    script: "reminders.applescript",
  },
  "com.tinyspeck.slackmacgap": { strategy: "accessibility" },
  "us.zoom.xos": { strategy: "accessibility" },
  "com.bloombuilt.dayone-mac": {
    strategy: "applescript",
    script: "dayone.applescript",
  },
  "net.sourceforge.skim-app.skim": {
    strategy: "applescript",
    script: "skim.applescript",
  },
  "com.apple.iBooksX": { strategy: "applescript", script: "books.applescript" },

  // ─── Terminal apps (Claude Code session detection) ──────
  "com.googlecode.iterm2": { strategy: "accessibility" },
};
