const seedrandom = require('seedrandom');
const yaml = require('js-yaml');
const print = require('./print');
const solve = require('./solver');
const hasMultipleSolutions = solve.hasMultipleSolutions;

const {
  bridgeBetween,
  possibleConnections,
  vertAdjacent,
  horAdjacent,
  addBridge,
  clear,
} = require('./utils');

const generate = (w = 10, h = 10, seed = undefined, quiet = false) => {
  seed = seed || new Date().getTime();
  quiet || console.log(`Seeding with "${seed}"`);
  seedrandom(seed, { global: true });

  const { random, sample, forEach, attempt } = require('lodash');

  const initialIsland = {
    x: random(w - 1),
    y: random(h - 1),
    b: 0,
    n: 0,
  };

  const level = {
    islands: [initialIsland],
    bridgesV: [],
    bridgesH: [],
  };

  const numIslands = Math.floor((w * h) / random(4, 8, true));

  let loops = 0;
  while (level.islands.length < numIslands && loops < 1000) {
    loops++;
    const island = sample(level.islands);

    const dir = random(0, 1, true);
    if (dir < 0.25) {
      // top
      let alreadyHasBridge = false;
      forEach(level.bridgesV, (bridge) => {
        if (bridge.x === island.x && bridge.y1 === island.y) {
          alreadyHasBridge = true;
          return false;
        }
      });
      if (alreadyHasBridge || island.y <= 0) {
        continue;
      }
      let newIsland = {
        x: island.x,
        y: random(island.y - 1),
        b: 0,
        n: 0,
      };
      // Use the existing island if there is already one
      let existing = false;
      forEach(level.islands, (otherIsland) => {
        if (otherIsland.x === newIsland.x && otherIsland.y === newIsland.y) {
          newIsland = otherIsland;
          existing = true;
          return false;
        }
      });
      if (vertAdjacent(level, island, newIsland)) {
        if (!existing) {
          level.islands.push(newIsland);
        }
        const b = random(1, 2);
        island.b += b;
        newIsland.b += b;
        addBridge(level, island, newIsland, b);
      }
    } else if (dir < 0.5) {
      // right
      let alreadyHasBridge = false;
      forEach(level.bridgesH, (bridge) => {
        if (bridge.x0 === island.x && bridge.y === island.y) {
          alreadyHasBridge = true;
          return false;
        }
      });
      if (alreadyHasBridge || island.x >= w - 1) {
        continue;
      }
      b = random(1, 2);
      let newIsland = {
        x: random(island.x + 1, w - 1),
        y: island.y,
        b: 0,
        n: 0,
      };
      // Use the existing island if there is already one
      let existing = false;
      forEach(level.islands, (otherIsland) => {
        if (otherIsland.x === newIsland.x && otherIsland.y === newIsland.y) {
          newIsland = otherIsland;
          existing = true;
          return false;
        }
      });
      if (horAdjacent(level, island, newIsland)) {
        if (!existing) {
          level.islands.push(newIsland);
        }
        const b = random(1, 2);
        island.b += b;
        newIsland.b += b;
        addBridge(level, island, newIsland, b);
      }
    } else if (dir < 0.75) {
      // bottom
      let alreadyHasBridge = false;
      forEach(level.bridgesV, (bridge) => {
        if (bridge.x === island.x && bridge.y0 === island.y) {
          alreadyHasBridge = true;
          return false;
        }
      });
      if (alreadyHasBridge || island.y >= h - 1) {
        continue;
      }
      b = random(1, 2);
      let newIsland = {
        x: island.x,
        y: random(island.y + 1, h - 1),
        b: 0,
        n: 0,
      };
      // Use the existing island if there is already one
      let existing = false;
      forEach(level.islands, (otherIsland) => {
        if (otherIsland.x === newIsland.x && otherIsland.y === newIsland.y) {
          newIsland = otherIsland;
          existing = true;
          return false;
        }
      });
      if (vertAdjacent(level, island, newIsland)) {
        if (!existing) {
          level.islands.push(newIsland);
        }
        const b = random(1, 2);
        island.b += b;
        newIsland.b += b;
        addBridge(level, island, newIsland, b);
      }
    } else {
      // left
      let alreadyHasBridge = false;
      forEach(level.bridgesH, (bridge) => {
        if (bridge.x1 === island.x && bridge.y === island.y) {
          alreadyHasBridge = true;
          return false;
        }
      });
      if (alreadyHasBridge || island.x <= 0) {
        continue;
      }
      b = random(1, 2);
      let newIsland = {
        x: random(island.x - 1),
        y: island.y,
        b: 0,
        n: 0,
      };
      // Use the existing island if there is already one
      let existing = false;
      forEach(level.islands, (otherIsland) => {
        if (otherIsland.x === newIsland.x && otherIsland.y === newIsland.y) {
          newIsland = otherIsland;
          existing = true;
          return false;
        }
      });
      if (horAdjacent(level, island, newIsland)) {
        if (!existing) {
          level.islands.push(newIsland);
        }
        const b = random(1, 2);
        island.b += b;
        newIsland.b += b;
        addBridge(level, island, newIsland, b);
      }
    }
  }
  level.islands.sort((a, b) => a.y + a.x / 16 - (b.y + b.x / 16));
  return level;
};

const generateInteresting = (w, h, quiet = false) => {
  const seed = new Date().getTime();
  let loop = 0;
  while (loop < 10000) {
    loop++;
    const attempt = generate(w, h, seed + loop, quiet);
    clear(attempt);
    let solutionData = null;
    try {
      solutionData = solve(attempt, true, true);
    } catch (e) {
      quiet || console.log('Rejected for no solution.');
      continue;
    }
    if (
      solutionData.heuristicsApplied.indexOf(2) === -1 ||
      solutionData.heuristicsApplied.indexOf(3) === -1 ||
      solutionData.heuristicsApplied.indexOf(4) === -1
    ) {
      quiet || console.log('Rejected for being boring 1.');
      continue;
    }

    if (
      solutionData.heuristicsApplied.indexOf(5) === -1 &&
      solutionData.heuristicsApplied.indexOf(6) === -1 &&
      solutionData.heuristicsApplied.indexOf(7) === -1 &&
      solutionData.heuristicsApplied.indexOf(8) === -1
    ) {
      quiet || console.log('Rejected for being boring 2.');
      continue;
    }
    const numZeros = solutionData.heuristicsApplied
      .slice(0, Math.floor((solutionData.heuristicsApplied.length / 5) * 2))
      .reduce((n, h) => n + (h === 0), 0);
    if (numZeros > solutionData.heuristicsApplied.length / 6) {
      quiet || console.log('Rejected for being boring 3.');
      continue;
    }
    clear(attempt);
    if (hasMultipleSolutions(attempt, true)) {
      quiet || console.log('Rejected for multiple solutions.');
      continue;
    }
    solve(attempt, quiet);
    clear(attempt);
    quiet || console.log(yaml.dump(attempt));
    return attempt;
  }
};

const levels = [];
for (let i = 0; i < 3; i++) {
  const level = generateInteresting(10, 10, true);
  const { complexity } = solve(level, true);
  clear(level);
  levels.push([complexity, level]);
}

levels
  .sort((a, b) => a[0] - b[0])
  .slice(-3)
  .forEach(([complexity, level]) => {
    solve(level);
    clear(level);
    console.log(yaml.dump(level));
  });
