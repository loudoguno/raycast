# Confetti Plus - Raycast Store Migration Plan

## Overview
Transform "Balloons Fancy" into "Confetti Plus" - a Raycast Store-ready extension with 7 high-quality visual effects, concurrent celebration support, and rapid 1-second animations.

**Timeline:** 1-2 weeks (10-17 hours total work)

---

## Phase 1: Foundation & Cleanup
**Session 1 • 2-3 hours • Difficulty: ⭐ EASY**

### 1.1 Repository Organization (Fresh Start)
- [ ] Create new GitHub repo: `loudoguno/confetti-plus`
- [ ] Clone to `~/code/loudoguno/confetti-plus`
- [ ] Copy current extension code from `~/code/raycast/extensions/balloons-fancy`
- [ ] Create professional initial structure (no old commit history)
- [ ] Add proper README.md, LICENSE (MIT), .gitignore
- [ ] Archive old repos on GitHub (mark as deprecated, keep for reference):
  - `loudoguno/raycast` → add "ARCHIVED" note to README
  - `loudoguno/extensions` → add "ARCHIVED" note to README

### 1.2 Rename Everything to "Confetti Plus"
- [ ] Update package.json:
  - name: "confetti-plus"
  - title: "Confetti Plus"
  - icon: "🎊"
  - description: "Celebrate with system-wide visual effects!"
- [ ] Rename BalloonsApp.swift → EffectsApp.swift (more generic)
- [ ] Update all file/directory references
- [ ] Update all string literals and comments
- [ ] Update build.sh to reference new app name

### 1.3 Remove Low-Quality Effects
**Final 7 Commands:**
- 🎊 Confetti Plus (NEW - to be added Phase 3)
- 🎈 Balloons
- 🎆 Fireworks
- 🍺 Beer Pour
- ❄️ Snow
- 👾 Space Invaders (rename from "8-Bit Pixels")
- 🌌 Galaxy Warp

**Remove 5 Commands:**
- [ ] Delete CupcakeView.swift + src/cupcake.tsx
- [ ] Delete CampfireView.swift + src/campfire.tsx
- [ ] Delete FeatherView.swift + src/feather.tsx
- [ ] Delete RainbowView.swift + src/rainbow.tsx
- [ ] Delete LeavesView.swift + src/leaves.tsx
- [ ] Update package.json commands array
- [ ] Update EffectType enum in EffectsApp.swift
- [ ] Update build.sh compilation list
- [ ] Rename "8-Bit Pixels" → "Space Invaders" in package.json

### 1.4 Initial Commit
- [ ] Stage all cleaned files
- [ ] Professional first commit: "Initial commit: Confetti Plus extension with 6 effects"
- [ ] Push to GitHub

**Deliverable:** Clean, professional codebase at `~/code/loudoguno/confetti-plus`

---

## Phase 2: Swift Tools Migration (THE BIG LIFT)
**Sessions 2-3 • 4-8 hours • Difficulty: ⭐⭐⭐ MEDIUM-HARD**

### 2.1 Research & Setup
- [ ] Study [raycast/extensions-swift-sample](https://github.com/raycast/extensions-swift-sample)
- [ ] Study [raycast/extensions-swift-tools](https://github.com/raycast/extensions-swift-tools)
- [ ] Create `swift/` directory in project root
- [ ] Add `Package.swift` configuration
- [ ] Install `raycast/extensions-swift-tools` dependency
- [ ] Configure build plugins (RaycastSwiftPlugin, RaycastTypeScriptPlugin)
- [ ] Update package.json with Swift build configuration

### 2.2 Migrate Swift Architecture
**Key Change:**
- **Before:** Standalone .app launched via `open -a /Applications/EffectsApp.app`
- **After:** TypeScript calls Swift functions directly marked with `@raycast` macro

**Tasks:**
- [ ] Move all .swift files to `swift/Sources/ConfettiPlus/`
- [ ] Create main module with `@raycast` exported functions
- [ ] Refactor window creation (no AppDelegate, direct NSWindow management)
- [ ] Each effect function creates independent overlay window
- [ ] Remove app lifecycle/termination code
- [ ] Windows self-close via `DispatchQueue.main.asyncAfter`
- [ ] Test Swift compilation via SPM

### 2.3 Update TypeScript Commands
- [ ] Remove all `exec("open -a ...")` calls
- [ ] Import generated Swift functions
- [ ] Update error handling for Swift exceptions
- [ ] Test each command file:
  - [ ] src/balloons.tsx
  - [ ] src/fireworks.tsx
  - [ ] src/beer.tsx
  - [ ] src/snow.tsx
  - [ ] src/space-invaders.tsx (renamed)
  - [ ] src/galaxy.tsx

### 2.4 Verify Core Functionality
- [ ] All 6 existing effects work correctly
- [ ] System-wide overlays appear properly
- [ ] Animations complete and windows close
- [ ] No memory leaks or orphaned windows
- [ ] Build succeeds with `npm run build`
- [ ] Dev mode works with `npm run dev`

**Deliverable:** Store-compliant extension using official Swift tools

---

## Phase 3: New Features & Concurrency
**Session 4 • 3-4 hours • Difficulty: ⭐⭐ MEDIUM**

### 3.1 Create Confetti Plus Command
- [ ] Study Raycast's built-in confetti aesthetic
- [ ] Create `ConfettiView.swift` with particle system
- [ ] Implement 4-corner bursts:
  - Upper-left corner
  - Upper-right corner
  - Lower-left corner (like Raycast default)
  - Lower-right corner (like Raycast default)
- [ ] Use colorful rectangles as confetti pieces
- [ ] Match Raycast's confetti style (high-quality similar, not pixel-perfect)
- [ ] Add `@raycast` function: `showConfettiPlus()`
- [ ] Create `src/confetti-plus.tsx` command
- [ ] Update package.json (make it the FIRST command - the flagship)

### 3.2 Test Concurrent Celebrations
- [ ] Rapidly trigger same effect multiple times
- [ ] Verify overlapping animations work smoothly
- [ ] Test mixed effects simultaneously:
  - Confetti + Fireworks + Balloons combo
  - Multiple fireworks at once
  - Rapid-fire confetti bursts
- [ ] Ensure windows don't interfere/block each other
- [ ] Verify memory cleanup with many concurrent windows
- [ ] Test performance with extreme concurrency (10+ simultaneous effects)

**Deliverable:** Feature-complete extension with 7 effects + concurrency support

---

## Phase 4: Polish & Submission Prep
**Session 5 • 2-3 hours • Difficulty: ⭐⭐ EASY-MEDIUM**

### 4.1 Shorten All Animations to ~1 Second
**Speed Up Every Effect:**

- [ ] **Balloons:** 12s → 1s
  - Increase fall speed 12x
  - May need fewer balloons (50 → 30?)

- [ ] **Fireworks:** 8s → 1s
  - Rapid simultaneous bursts
  - Faster particle expansion

- [ ] **Beer Pour:** 6s → 2s
  - Quick pour animation
  - Fast bubble rise

- [ ] **Snow:** 10s → 1s
  - Ultra-fast blizzard
  - 10x speed with more chaos

- [ ] **Space Invaders:** 8s → 1s
  - Rapid cascade
  - Quick march across screen

- [ ] **Galaxy Warp:** 8s → 1s
  - Instant warp-speed effect
  - Faster star streaks

- [ ] **Confetti Plus:** Design for 1s from start

**Testing:**
- [ ] Verify effects don't look chaotic/unreadable
- [ ] May need to reduce particle counts
- [ ] Be willing to adjust to 1.5s if 1s feels too fast

### 4.2 Raycast Store Submission Prep
- [ ] Create `metadata/` folder with extension screenshots (PNG, 1280x800)
- [ ] Write comprehensive README.md:
  - Hero image/demo GIF
  - All 7 effects documented with descriptions
  - Installation instructions (once in store)
  - Usage examples
  - Feature highlights (concurrent, native, fast)
- [ ] Create CHANGELOG.md (v1.0.0 initial release)
- [ ] Verify package.json metadata:
  - author: "loudog"
  - categories: ["Fun"]
  - license: "MIT"
- [ ] Review [Raycast Store Guidelines](https://developers.raycast.com/basics/prepare-an-extension-for-store)
- [ ] Ensure NO binaries in repo (only source code)
- [ ] Add screenshots showing each effect

### 4.3 Final Quality Check
- [ ] ✅ All 7 effects work flawlessly
- [ ] ✅ Concurrent launching works smoothly (rapid-fire + mixed)
- [ ] ✅ Animations are snappy (~1s each)
- [ ] ✅ No console errors or warnings
- [ ] ✅ Extension icon and metadata look professional
- [ ] ✅ README is clear, compelling, and well-formatted
- [ ] ✅ Code is clean and well-commented
- [ ] ✅ Git history is professional (clean commits)

**Deliverable:** Production-ready Confetti Plus extension!

---

## Raycast Store Submission (Post-Development)

### When Ready to Publish:
1. Final commit and tag: `v1.0.0`
2. Run `npm run publish` from extension directory
3. Authenticate with GitHub
4. Raycast creates PR to `raycast/extensions` automatically
5. Review process begins
6. Address any feedback from Raycast team
7. Extension goes live! 🎉

---

## Success Criteria

✅ **Functionality**
- 7 high-quality visual effects (Confetti Plus, Balloons, Fireworks, Beer, Snow, Space Invaders, Galaxy)
- Concurrent celebrations (rapid-fire same effect + mixed effects simultaneously)
- All animations ~1 second (snappy and fun)

✅ **Store Compliance**
- Uses official `raycast/extensions-swift-tools`
- All Swift source code visible (no opaque binaries)
- Proper metadata, screenshots, and documentation

✅ **Professional Presentation**
- Clean repository: `loudoguno/confetti-plus`
- Professional README with examples
- Clear git history (no messy experimental commits)
- Ready for debut as Raycast extension developer

---

## Risk Mitigation Strategies

**If Swift Tools Migration Is Difficult:**
- Reference `raycast/extensions-swift-sample` extensively
- Break migration into one effect at a time
- Ask Raycast Discord community for support
- Budget extra time (up to 10 hours instead of 8)

**If 1-Second Animations Look Too Fast/Chaotic:**
- Make duration configurable during development
- Test multiple speeds: 0.5s, 1s, 1.5s, 2s
- Get feedback before finalizing
- Prioritize "feels good" over exact 1s target

**If Confetti Plus Visual Quality Needs Iteration:**
- Start with simple particle system
- Iterate based on what looks good
- "High-quality similar" is the goal, not "pixel-perfect match"
- Can always improve in v1.1 after launch

**If Concurrent Celebrations Have Issues:**
- Test window z-ordering and mouse event passthrough
- Verify each window manages its own lifecycle
- May need window coordination logic (unlikely with Swift tools approach)

---

## Post-Launch Ideas (Future Versions)

- 🎨 Customizable colors/themes
- ⚙️ Configurable animation speeds
- 🎯 More effects (Hearts, Confetti Cannon, Matrix Rain, etc.)
- 🔊 Better sound effects
- 📊 Multi-monitor support
- ⌨️ Global keyboard shortcuts

---

## Next Session: Phase 1 - Foundation & Cleanup
**When ready:** Repository setup, rename to Confetti Plus, remove low-quality effects (2-3 hours)
