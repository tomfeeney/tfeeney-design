# Kaijū Run — Arcade Edition

The playable rebuild lives in this folder. The original game in the parent folder remains untouched. Runtime artwork is copied unchanged from the original: both monsters, green/red atomic blasts, shields, roar, aircraft, bombs, destroyer, city backgrounds, and layered waves. Lower bodies stay clipped at the waterline behind foreground waves. Background and foreground planes move independently.

New scenery drafts are awaiting approval and are **not loaded by the game**. Their provenance is recorded in ASSET_PROMPTS.json.

## Play

Serve the parent kaiju folder over HTTP (opening index.html directly will not load modules/data):

```sh
python3 -m http.server 8087 --bind 127.0.0.1
```

Visit http://127.0.0.1:8087/kaiju-arcade/. No dependencies or build step are required.

## Game modes

- Harbor Mission: defeat 12 aircraft across interceptor, missile attacker, and bomber roles; sink the destroyer; move right to escape.
- Three-District Campaign: Tokyo Bay, Fuji Coast, and Tokyo Skyline, with increasing pressure, story briefings, and a refit between districts.
- Survival: escalating encounters with refits between rounds.
- Daily Storm: a fixed Godzilla/Arcade encounter seed shared for the calendar date in America/Los_Angeles; a three-minute limit.
- Original trivia: 12 timed questions from the original question bank.

Rookie, Arcade, and Veteran adjust enemy health, speed, damage, spawning, and score multipliers. Godzilla has 190 health and faster energy recovery; Mechagodzilla has 155 health, faster movement, and stronger, more efficient firepower.

Regeneration restores 65 health and energy. Atomic Overdrive increases beam and roar damage by 20%. Shield Surge restores shields, energy, and roar. Aircraft warn before firing. Destroyer salvos intensify at 65% and 30% health; sinking completes before the escape begins.

## Controls and settings

WASD/arrows move; hold Space to fire; hold S/down to dive; R roars; P/Escape pauses; M mutes. Roar costs 25 energy and recharges through kills. Diving provides cover for eight seconds, followed by a three-second surface recovery. Exhausted beam energy must recharge before firing resumes.

Standard controllers: left stick/D-pad move, A/right trigger fire, B/right bumper roar, Start pause. In menus, up/down moves focus, left/right changes a focused select, A confirms. Touch buttons support simultaneous movement and firing. Landscape is recommended; portrait preserves artwork proportions with a contained playfield.

Settings include volume, mute, reduced motion, and low effects. System reduced-motion preferences are respected. Blur/hidden tabs pause combat. Dialogs support keyboard focus and status announcements.

## Editable structure

- data/game.json: monster profiles, difficulty, enemy roles, encounter weights/objectives, upgrades, and boss phases.
- js/game/combat.js and simulation.js: combat rules and fixed 60 Hz simulation.
- js/game/rendering.js: original sprites, water clipping, multiplane backgrounds/waves, HUD.
- js/game/input.js, audio.js, missions.js: input, original audio, progression.
- js/game/ui.js, trivia.js, settings.js, leaderboard.js: interface and persistence.
- js/game/assets.js and main.js: loading and startup.

The previous rebuild's unused scripts are retained under reference/previous-runtime; index.html loads only the modular runtime.

## Scores and verification

Scores are local to this browser, separated by mode/difficulty and daily date. The save path validates results against the combat ledger and prevents duplicate saves. Browser storage can be edited; this is not a secure public leaderboard. A public leaderboard would require server-side validation.

Run `npm test` in this folder. Tests cover original asset byte identity, loading errors, seeded roles, beam damage at 30/60/120 FPS, energy gating, oxygen, shield immunity, roar, upgrades, harbor boss/sinking/escape victory, survival/daily rules, drawing original effects and water clipping, score integrity, controller mapping, and simultaneous touch release. Browser verification covers loading, original green/red blasts, destroyer battle and sinking, pause/resume, defeat/results, and responsive presentation. Physical controller/mobile hardware and extended balance testing remain unverified.
