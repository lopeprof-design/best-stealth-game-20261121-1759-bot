// The Moonlit Archive — tuning, level map and guard patrols.
// One job: every number and every tile of the level lives here, so the
// rest of the game reads the archive from this file alone.

export const TILE = 32;
export const COLS = 30;
export const ROWS = 20;
export const VIEW_W = COLS * TILE; // 960
export const VIEW_H = ROWS * TILE; // 640

// Legend: # wall, . floor, S bookshelf (tall cover, blocks sight),
// T reading table (low cover, blocks movement, blocks sight only for a
// crouched player), P potted plant (low cover), L floor lamp (light pool),
// M star-chart manuscript, E exit door, @ player start.
export const MAP = [
  '##############################',
  '#......#.......#......#.....E#',
  '#..M...#...S...#..S...#......#',
  '#......#.......#......#......#',
  '#.SS...#...S...#..S...#......#',
  '#.....................#......#',
  '#..S..L#...S..L#..S..L#...S.L#',
  '#......#.......#......#......#',
  '#..S...#...S...#..S...#......#',
  '#..M...........#......#..S...#',
  '#......#...S...#..S...#......#',
  '#.SS...#.......#......#...M..#',
  '#..............#......#......#',
  '#..S..L#......L#....L....S..L#',
  '#......#...S...#..S...#......#',
  '#.SS...#.......#......#......#',
  '#......#...S...#..S...#...S..#',
  '#..T....T.......T......T.....#',
  '#@...........................#',
  '##############################',
];

// Guard patrols: each guard shuttles up and down one aisle (tile coords),
// pausing at each end to look around the room.
export const GUARDS = [
  { waypoints: [[4, 2], [4, 16]], speed: 52 },
  { waypoints: [[10, 2], [10, 16]], speed: 58 },
  { waypoints: [[17, 2], [17, 16]], speed: 55 },
  { waypoints: [[24, 3], [24, 16]], speed: 48 },
];

export const TUNING = {
  playerWalk: 118, // px per second
  playerCrouch: 62,
  playerSprint: 178,
  guardChase: 132,
  guardInvestigate: 96,
  visionRange: 185, // px, standing in the open under light
  visionRangeDark: 128, // px, standing in shadow
  visionRangeCrouched: 118, // px, crouched behind low cover
  visionHalfAngle: 0.62, // radians, ~35 degrees each side
  suspicionGain: 95, // per second while fully seen
  suspicionDecay: 26, // per second while unseen
  alarmDuration: 6, // seconds guards keep hunting after losing you
  noiseWalk: 46, // px radius of footsteps while walking
  noiseSprint: 110,
  noiseCrouch: 16,
  pebbleNoise: 150,
  pebbles: 3,
  lives: 3,
  manuscripts: 3,
  catchDistance: 26, // px, a guard touching you during the alarm
  lampRadius: 95, // px pool of light around a lamp
};

// Colours of the night archive, shared by the renderer.
export const PALETTE = {
  floorLight: '#3a3226',
  floorDark: '#332c20',
  floorShadow: '#241f16',
  wall: '#171310',
  wallTop: '#2b2118',
  shelf: '#4a2f1d',
  shelfTop: '#6b4426',
  shelfBookA: '#8a5a2b',
  shelfBookB: '#5a6b4a',
  shelfBookC: '#7a4a5a',
  table: '#5a4028',
  tableTop: '#7a5a38',
  plant: '#3f6b35',
  lampGlow: 'rgba(255, 196, 110, 0.20)',
  lampCore: '#ffd28a',
  moon: 'rgba(150, 180, 255, 0.10)',
  coneCalm: 'rgba(255, 214, 110, 0.13)',
  coneSuspicious: 'rgba(255, 170, 60, 0.22)',
  coneAlarm: 'rgba(255, 70, 60, 0.26)',
  coneEdge: 'rgba(255, 220, 130, 0.35)',
  player: '#e8d9a0',
  playerCloak: '#7a4a8a',
  guard: '#c94f43',
  guardHelm: '#e8c96a',
  manuscript: '#ffe9a8',
  exit: '#7ae08a',
  exitGlow: 'rgba(122, 224, 138, 0.25)',
  hud: '#e8ddc0',
};
