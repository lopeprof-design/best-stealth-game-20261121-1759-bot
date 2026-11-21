# The Moonlit Archive — a stealth game

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/lopeprof-design/best-stealth-game-20261121-1759-bot/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/lopeprof-design/best-stealth-game-20261121-1759-bot/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A top-down stealth game in the browser, built for the make.fun **best-stealth-game-20261121-1759** bounty. You are **Wren**, a courier-thief slipping through a moonlit archive at night: stay out of the watchmen's lantern cones, hide behind bookshelves, crouch behind tables and plants, steal all 3 star-charts, and reach the green EXIT door unseen.

Everything is original: the level, the characters, the story, the art, and the synthesized sound. No assets from any commercial game.

## What is in the game

- **A moonlit archive, seen from above** — four stack rooms of bookshelves, a reading room of tables, potted plants, and pools of lamplight. Lamp-light makes you easy to spot; shadow makes you hard to see.
- **Four patrolling watchmen** — each walks an aisle, pauses to look around, and sweeps a vision cone that is clipped by the shelves, so cover really works.
- **A detection system with room to recover** — a guard who glimpses you grows suspicious (a "?" over his head) and comes to look; only a full alarm ("!") sends all four hunting you. Break line of sight and the alarm cools down.
- **Noise that matters** — sprinting is loud, crouching is quiet, and a tossed pebble (click, 3 per run) rings where it lands and lures a nearby guard away to investigate.
- **Three lives, three star-charts** — get caught and you lose a life and restart at the door; collect every chart and the EXIT door unlocks.
- **Synthesized sound only** — footsteps, suspicion blips, alarm stings, pickup chimes, and a win arpeggio, all generated with WebAudio. No audio files, no network requests while playing.

## How to play

```sh
node serve.ts        # serves game/ at http://localhost:8080
```

Open http://localhost:8080 in desktop Chrome and play:

- **WASD / arrows** — move
- **Shift** — sprint (fast, loud)
- **C** — crouch (slow, hard to see, hidden by low cover)
- **Click** — toss a pebble toward the mouse to distract a guard

## Run it

```sh
node serve.ts
```

## Files

- `game/index.html` — the page; `game/src/` holds the game, one job per file: `config.js` (level and tuning), `world.js` (collision and sight), `guard.js` (patrol AI and vision cones), `player.js` (movement and pebbles), `render.js` (all drawing), `audio.js` (synthesized sound), `input.js` (keyboard and mouse), `main.js` (loop, states, screenshot poses).
- `screenshots/` — 3 real renders of the game: title, mid-game, and the win screen.
- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=tghy00yw&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
