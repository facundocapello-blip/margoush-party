# MARGOUSH 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 2.5D beat 'em up in a 3D street, using the V23.8 caricatures as sprites, with scoring and a shared Supabase ranking, published at `margoush-party/3d/`.

**Architecture:** Static site, no build step. `index.html` loads Three.js r128 (global `THREE`) from cdnjs, then ES modules from `js/`. Pure logic (score, ranking, input mapping) lives in modules with no DOM or THREE dependency so Node can test them. Everything visual is checked with Playwright on headless Chrome.

**Tech Stack:** Three.js r128, vanilla ES modules, Web Audio, Supabase REST (plain `fetch`, no client library), Node `node:test`, Playwright (`/opt/npm-tools/node_modules/playwright`).

**Spec:** `docs/superpowers/specs/2026-11-15-margoush-3d-diseno.md` (also in the project as `claude/margoush_3d_diseno.md`).

## Global Constraints

- Hosting: GitHub Pages, repo `facundocapello-blip/margoush-party`, folder `/3d/`. Root `index.html` and `preview-v*/` stay untouched.
- Every on-screen text in Rioplatense Spanish (voseo). Only exception: Marine's «Oh là là!».
- Total `3d/assets/` weight < 6 MB.
- Sprites are side views only: the street runs along +X; actors face left or right, never toward the camera.
- 60 fps target on a mid-range phone; auto quality drop when sustained FPS < 38.
- A run lasts 3 to 5 minutes for an average player.
- Ranking: top 20, "Esta semana" and "Histórico", columns apodo, héroe, puntaje, fecha. Never shows "online" unless the last Supabase call succeeded.
- No secrets in the repo beyond the Supabase anon key; security is enforced by RLS.
- Push to `main` (which publishes) only after Facu says OK on the preview.

## Review Focus

1. Nickname that is blank, 40 characters, emoji-only or contains `<script>` → trimmed to 16 chars, blank rejected with a message, rendered with `textContent` (Task 3 test + Task 8 test).
2. Supabase down, slow or offline → submit and load give up after 6 s, score saved locally, table says "Sin conexión: tu puntaje quedó guardado en este celular" (Task 3 test).
3. Double tap on "Guardar puntaje" → exactly one row sent (Task 8 test).
4. App sent to background or phone call mid-fight → game pauses, no input stays pressed after return (Task 5 test).
5. Rotating the phone or resizing mid-run → canvas and controls re-fit, hero stays on screen (Task 4 test).

---

### Task 1: Asset extraction

**Files:**
- Create: `tools/extract_assets.py`, `3d/assets/` (output), `tests/assets.test.mjs`

**Interfaces:**
- Produces: `3d/assets/manifest.json` = `{ "<name>": { "file": "<name>.webp", "w": int, "h": int, "frames": int, "cols": int, "rows": int } }` with names `douge_idle, douge_run, douge_attack, marine_idle, marine_run, marine_attack, chaky_run, boss_idle, boss_run, boss_attack, boss_hurt, margot_sheet, kidnap_sheet, courier, street_bg, facu, music_douge, music_marine` (music as `.mp3`).

- [ ] **Step 1: Write the failing test** `tests/assets.test.mjs`: manifest exists; every listed file exists; summed size of `3d/assets/*` < 6_000_000 bytes; `douge_run.frames === 6`; `margot_sheet.cols === 2 && rows === 2`.
- [ ] **Step 2: Run** `node --test tests/assets.test.mjs` → FAIL (no manifest).
- [ ] **Step 3: Implement** `extract_assets.py <V23.8 html> <out dir>`: decode the 24 data URIs, map by key as in V23.8 (`dougeIdle`… `boss`, `margot`, `A.street`, `A.courier`, `A.little`, menu image = `facu`), downscale so the longest side ≤ 1024 px (run strips ≤ 2172×400), save WebP quality 82, copy MP3s, write the manifest. Run with `python3 -I`.
- [ ] **Step 4: Run** the test → PASS.
- [ ] **Step 5: Commit** `feat(3d): extract and compress V23.8 art`.

### Task 2: Score

**Files:** Create `3d/js/score.js`, `tests/score.test.mjs`

**Interfaces:**
- Produces: `createScore() → { addKill(kind: 'minion'|'boss'), addPickup(kind: 'bottle'|'secret'), addHit(), takeDamage(), finalize({ hpLeft, hpMax, seconds }) → { total, rank, breakdown }, get total, get multiplier }`.

- [ ] **Step 1: Tests:** minion = 100 × multiplier; boss = 2000; bottle = 50; secret = 500; multiplier starts 1, +0.1 per `addHit()`, capped at 3, back to 1 on `takeDamage()`; `finalize` adds `hpLeft/hpMax × 3000` and `max(0, 300 − seconds) × 10`; rank S ≥ 15000, A ≥ 10000, B ≥ 6000, else C; totals are integers.
- [ ] **Step 2: Run** `node --test tests/score.test.mjs` → FAIL.
- [ ] **Step 3: Implement** `score.js`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(3d): scoring`.

### Task 3: Ranking (Supabase + local fallback)

**Files:** Create `3d/js/ranking.js`, `3d/js/config.js`, `3d/supabase.sql`, `tests/ranking.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `createRanking({ url, anonKey, fetchImpl = fetch, storage = localStorage, timeoutMs = 6000 }) → { submit({ nickname, hero, score }) → Promise<{ ok: boolean, online: boolean, error?: string }>, top({ period: 'week'|'all', limit = 20 }) → Promise<{ online: boolean, rows: Array<{ nickname, hero, score, created_at }> }> }`; `sanitizeNickname(s) → string|null`.
- `config.js` exports `SUPABASE_URL`, `SUPABASE_ANON_KEY` (empty strings until Task 9).

- [ ] **Step 1: Tests** with a fake `fetchImpl`: `sanitizeNickname('  Faca  ') === 'Faca'`; 40 chars → 16; `''` and `'   '` → `null`; `'<b>x</b>'` kept as text (escaping is the renderer's job); `submit` with score 1.5, −1 or 250000 → `{ ok:false }`; hero not in `['douge','marine']` → `{ ok:false }`; fetch that never resolves → after `timeoutMs` returns `{ ok:true, online:false }` and the row is in `storage`; `top({period:'week'})` sends `created_at=gte.<ISO 7 days ago>` and `order=score.desc&limit=20`; with empty URL config → `online:false`, rows from storage.
- [ ] **Step 2: Run** `node --test tests/ranking.test.mjs` → FAIL.
- [ ] **Step 3: Implement** `ranking.js` with REST calls `POST {url}/rest/v1/scores` (`Prefer: return=minimal`) and `GET {url}/rest/v1/scores?select=nickname,hero,score,created_at&...`, headers `apikey` and `Authorization: Bearer <anonKey>`, `AbortController` for the timeout. `supabase.sql`: table `scores(id bigint identity pk, nickname text check (char_length between 1 and 16), hero text check (hero in ('douge','marine')), score int check (score between 0 and 200000), created_at timestamptz default now())`, RLS on, policies `select` for `anon` and `insert` for `anon`, no update/delete.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(3d): ranking with offline fallback`.

### Task 4: Street, camera and sprite actors

**Files:** Create `3d/index.html`, `3d/css/game.css`, `3d/js/main.js`, `3d/js/assets.js`, `3d/js/sprites.js`, `3d/js/world.js`, `3d/js/input.js`, `tests/e2e/harness.mjs`, `tests/e2e/walk.e2e.mjs`

**Interfaces:**
- Consumes: Task 1 manifest.
- Produces:
  - `loadAssets(manifestUrl) → Promise<Assets>`; `Assets.texture(name) → THREE.Texture`, `Assets.meta(name)`.
  - `class SpriteActor { constructor(scene, assets, { poses: { idle, run, attack, hurt? }, heightM }); setPose(name); setFacing(dir: -1|1); update(dt, speedMps); position: THREE.Vector3; flash(seconds); dispose() }`. Run frame advances with distance (1 frame per 0.35 m), feet anchored at `position.y`.
  - `buildStreet(scene, assets) → { bounds: { minX, maxX, minZ, maxZ }, zones: Array<{ id, startX, endX }>, colliders }`. Street along X from 0 to 220 m, walkable depth Z −3.5…3.5. Zones: `le-concept` 0–30, `vereda` 30–90, `plaza` 90–140, `pasaje` side alley at X 115 (secret), `galpon` 170–220.
  - `createInput(dom) → { moveX, moveZ, pressed(action), consume(action), reset() }`, actions `attack | jump | dodge | power | pause`. Keys and touch per spec.
  - `window.__game` test hook: `{ state, hero, enemies, score, setStage(id) }`.
  - Camera: fixed angle (pitch ≈ 32°), height 9 m, 14 m in front (+Z), follows hero X with look-ahead.
- [ ] **Step 1: Test** `walk.e2e.mjs`: page loads with no console errors; after choosing Douge and holding →, hero X increases > 5 m in 2 s; hero sprite facing is +1, then −1 after holding ←; screenshot `walk.png`; resize 844×390 → 390×844 mid-walk, hero still inside the viewport (projected coords within 0..1).
- [ ] **Step 2: Run** `node tests/e2e/walk.e2e.mjs` → FAIL.
- [ ] **Step 3: Implement** the files. Street look follows the V23.8 background: violet dusk sky gradient, warm cobblestone, façades with lit windows, awnings, lamp posts with point lights; `street_bg` as a distant backdrop plane.
- [ ] **Step 4: Run** → PASS; inspect `walk.png`.
- [ ] **Step 5: Commit** `feat(3d): street, camera and sprite actors`.

### Task 5: Hero combat and minions

**Files:** Create `3d/js/hero.js`, `3d/js/enemies.js`, `3d/js/fx.js`; modify `3d/js/main.js`; test `tests/e2e/combat.e2e.mjs`

**Interfaces:**
- Consumes: `SpriteActor`, `createInput`, `createScore`.
- Produces: `createHero(id: 'douge'|'marine', ctx) → { actor, hp, hpMax: 5, update(dt), hurt(amount, fromX) }`; `createEnemies(ctx) → { spawnWave(zoneId), update(dt), alive() }`; `fx.hit(pos, strength)`, `fx.shake(amount)`, `fx.hitstop(seconds)`, `fx.popup(pos, text, color)`.
- Combat: 3-hit combo (third hit 1.6× damage, bigger knockback), attack buffer 0.2 s, dodge with 0.35 s invulnerability, jump, power with 7 s cooldown (Douge: forward fist "VERDADES" 2 damage; Marine: radius stun + «Oh là là!» via speechSynthesis `fr-FR`). Invulnerability 0.7 s after being hit. Waves: `vereda` 3 minions, `plaza` 5 minions; street gates block progress until a wave is cleared. Pickups: 8 bottles (🍼, +1 hp up to 5, `addPickup('bottle')`) along the street; breakable crates seal the `pasaje` alley, and reaching its end gives `addPickup('secret')` once per run.
- [ ] **Step 1: Test** `combat.e2e.mjs`: a bottle adds 50 points and 1 hp; the alley is blocked until its crates break, and the secret scores 500 only once; bot (move toward nearest enemy, attack) clears `vereda` within 40 s; `score.total` > 0 and multiplier rose above 1; standing in an enemy strike loses at most 1 hp per 0.7 s; `document.hidden` simulated → `state === 'paused'` and `input.moveX === 0` after resume.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(3d): combat, minions and hit feel`.

### Task 6: Facu (helper, joke, host)

**Files:** Create `3d/js/facu.js`; modify `main.js`; test `tests/e2e/facu.e2e.mjs`

**Interfaces:**
- Consumes: `SpriteActor`, `createEnemies`, `fx`.
- Produces: `createFacu(ctx) → { actor, update(dt), say(text, seconds) }`. Height 0.6× hero. Follows 1.5 m behind the hero; hits the nearest enemy within 2 m every 1.0 s for 1 damage. Every 12 s, if ≥ 2 enemies are within 4 m: joke → those enemies stunned 1.5 s, popup «¡JAJAJA!». Never dies; teleports beside the hero if > 12 m away.
- Host lines (exact copy): intro «Buenas noches, Le Concept. Esta noche, BIG CHAKY se llevó a Margot. ¡Aplausos para nuestro héroe!»; result «¡Señoras y señores, puntaje final!»; joke popups rotate between «¡JAJAJA!», «¡No da más!», «¡Qué chiste, che!».
- [ ] **Step 1: Test:** Facu stays within 3 m of the hero while walking; with the hero idle and 2 minions near, some enemy takes damage with no hero attack in 6 s; a joke stuns ≥ 2 enemies within 15 s.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(3d): Facu helper and host`.

### Task 7: Big Chaky, intro and rescue

**Files:** Create `3d/js/boss.js`, `3d/js/story.js`; modify `main.js`; test `tests/e2e/story.e2e.mjs`

**Interfaces:**
- Consumes: hero, enemies, Facu, score.
- Produces: `createBoss(ctx) → { hp, hpMax: 30, update(dt) }` with lunge (0.5 s windup) and slam (0.7 s windup, jumpable shockwave); phase 2 at 50 %: faster, double lunge. `story.intro()` (Chaky pushes the stroller off-screen using `kidnap_sheet`, ≤ 4 s, skippable by tap); `story.rescue()` (bars rise, Margot `margot_sheet` frame "festejando", hero and Facu jump, Facu host line).
- [ ] **Step 1: Test:** `setStage('galpon')` spawns boss with hp 30; dealing 15 damage sets phase 2; boss death awards 2000 and ends in `state === 'result'` within 5 s; intro skip by tap reaches `state === 'playing'` in < 1 s.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(3d): Big Chaky, intro and rescue`.

### Task 8: Screens, ranking UI and audio

**Files:** Create `3d/js/ui.js`, `3d/js/audio.js`; modify `index.html`, `game.css`, `main.js`; test `tests/e2e/ui.e2e.mjs`

**Interfaces:**
- Consumes: `createRanking`, `createScore().finalize`, Facu `say`.
- Produces: screens `menu`, `select`, `pause`, `result`, `ranking` styled as a game (no page header, big buttons, the caricatures on screen). Result: total, rank letter, breakdown, nickname input (remembered locally), "Guardar puntaje" (disabled after first tap), "Jugar de nuevo", "Ver ranking". Ranking: tabs "Esta semana" / "Histórico", status line online/offline. Audio: V23.8 theme per hero for the street, a faster synthesized track in the `galpon` (boss), synthesized SFX per action, mute toggle remembered.
- [ ] **Step 1: Test:** full bot run from menu to result; nickname `<img src=x onerror=alert(1)>` renders as literal text in the table; double-click on "Guardar puntaje" sends exactly 1 request (count via `page.route`); with Supabase route aborted, status shows «Sin conexión: tu puntaje quedó guardado en este celular»; no horizontal overflow at 320×568.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(3d): game screens, ranking UI and audio`.

### Task 9: Supabase setup, performance and publish

**Files:** Modify `3d/js/config.js`, root `README.md` (one "Versión 3D" line); test `tests/e2e/perf.e2e.mjs`

- [ ] **Step 1: Facu creates the Supabase project** (guided), runs `3d/supabase.sql` in the SQL editor, and passes the project URL and anon key. Put them in `config.js`.
- [ ] **Step 2: Test** `perf.e2e.mjs` at 390×844, DPR 2, CPU throttled 4×: average frame time over a 20 s bot run ≤ 22 ms after auto-quality; then a real insert + read against Supabase returns the inserted nickname.
- [ ] **Step 3: Run** all tests: `node --test tests/*.test.mjs && for f in tests/e2e/*.e2e.mjs; do node $f || exit 1; done` → all PASS.
- [ ] **Step 4: Preview for Facu:** publish `3d/` as a private claude.ai artifact (multi-file). The ranking shows offline there, because that page cannot reach Supabase; everything else is real. Push branch `feat-3d`. On his OK, merge to `main`.
- [ ] **Step 5: Verify** `https://facundocapello-blip.github.io/margoush-party/3d/` loads with no console errors and the ranking shows "online". Facu tests on a real iPhone.
