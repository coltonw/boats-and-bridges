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
  randomBiased,
  connectedOutside,
  compress,
  adjacent,
  removeBridge,
  connectedByWater,
} = require('./utils');

const {
  cloneDeep,
  random,
  sample,
  forEach,
  attempt,
  shuffle,
  partition,
} = require('lodash');

const generateIsland = (level, w, h) => {
  const island = sample(level.islands);

  const dir = Math.random();
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
      return;
    }
    let newIsland = {
      x: island.x,
      y: randomBiased(island.y - 1, 0),
      b: 0,
      n: 0,
    };
    // Use the existing island if there is already one
    let existing = false;
    forEach(level.islands, (otherIsland) => {
      if (
        otherIsland.x === newIsland.x &&
        otherIsland.y >= newIsland.y &&
        otherIsland.y < island.y
      ) {
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
      return;
    }
    b = random(1, 2);
    let newIsland = {
      x: randomBiased(island.x + 1, w - 1),
      y: island.y,
      b: 0,
      n: 0,
    };
    // Use the existing island if there is already one
    let existing = false;
    forEach(level.islands, (otherIsland) => {
      if (
        otherIsland.x <= newIsland.x &&
        otherIsland.x > island.x &&
        otherIsland.y === newIsland.y
      ) {
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
      return;
    }
    b = random(1, 2);
    let newIsland = {
      x: island.x,
      y: randomBiased(island.y + 1, h - 1),
      b: 0,
      n: 0,
    };
    // Use the existing island if there is already one
    let existing = false;
    forEach(level.islands, (otherIsland) => {
      if (
        otherIsland.x === newIsland.x &&
        otherIsland.y <= newIsland.y &&
        otherIsland.y > island.y
      ) {
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
      return;
    }
    b = random(1, 2);
    let newIsland = {
      x: randomBiased(island.x - 1, 0),
      y: island.y,
      b: 0,
      n: 0,
    };
    // Use the existing island if there is already one
    let existing = false;
    forEach(level.islands, (otherIsland) => {
      if (
        otherIsland.x >= newIsland.x &&
        otherIsland.x < island.x &&
        otherIsland.y === newIsland.y
      ) {
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
};

const generate = (w = 10, h = 10, seed = undefined, quiet = false) => {
  seed = seed || new Date().getTime();
  quiet || console.log(`Seeding with "${seed}"`);
  seedrandom(seed, { global: true });

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

  const numIslands = Math.floor((w * h) / random(4, 7, true));
  let loops = 0;
  const simplifyLoops = 3;
  for (let i = 0; i < simplifyLoops; i++) {
    while (level.islands.length < numIslands && loops < 1000) {
      loops++;
      generateIsland(level, w, h);
    }
    simplify(level);
    compress(level);
    if (i < simplifyLoops - 1) {
      center(level, w, h);
    }
  }
  level.islands.sort((a, b) => a.y + a.x / 16 - (b.y + b.x / 16));
  return level;
};

const simplify = (level) => {
  const bridgelessLevel = cloneDeep(level);
  clear(bridgelessLevel);
  for (let i = 0; i < level.islands.length; i++) {
    let adj = null;
    for (let j = 0; j < level.islands.length; j++) {
      if (i === j) {
        continue;
      }
      if (
        adjacent(
          bridgelessLevel,
          bridgelessLevel.islands[i],
          bridgelessLevel.islands[j]
        ) &&
        (bridgelessLevel.islands[i].b > 1 || bridgelessLevel.islands[j].b > 1)
      ) {
        if (adj) {
          // more than one adjacent island, get out of j to go to next i
          adj = null;
          break;
        }
        adj = level.islands[j];
      }
    }
    if (adj) {
      removeBridge(level, level.islands[i], adj, level.islands[i].n);
      level.islands.splice(i, 1);
      bridgelessLevel.islands.splice(i, 1);
      i = 0;
      j = 1;
    }
  }
};

// This only works after a compress
const center = (level, w, h) => {
  let maxX = 0;
  let maxY = 0;
  forEach(level.islands, (island) => {
    maxX = Math.max(maxX, island.x);
    maxY = Math.max(maxY, island.y);
  });
  const xMove = Math.floor((w - maxX - 1) / 2);
  const yMove = Math.floor((h - maxY - 1) / 2);
  if (xMove > 0 || yMove > 0) {
    level.islands.forEach((island) => {
      island.x = island.x + xMove;
      island.y = island.y + yMove;
    });

    (level.trucks || []).forEach(({ truck, garage }) => {
      if (truck) {
        truck.x = truck.x + xMove;
        truck.y = truck.y + yMove;
      }
      if (garage) {
        garage.x = garage.x + xMove;
        garage.y = garage.y + yMove;
      }
    });

    (level.boats || []).forEach(({ boat, dock }) => {
      if (boat) {
        boat.x = boat.x + xMove;
        boat.y = boat.y + yMove;
      }
      if (dock) {
        dock.x = dock.x + xMove;
        dock.y = dock.y + yMove;
      }
    });

    (level.pirates || []).forEach((pirate) => {
      pirate.x = pirate.x + xMove;
      pirate.y = pirate.y + yMove;
    });

    (level.bridgesH || []).forEach((bridgeH) => {
      bridgeH.x0 = bridgeH.x0 + xMove;
      bridgeH.x1 = bridgeH.x1 + xMove;
      bridgeH.y = bridgeH.y + yMove;
    });

    (level.bridgesV || []).forEach((bridgeV) => {
      bridgeV.x = bridgeV.x + xMove;
      bridgeV.y0 = bridgeV.y0 + yMove;
      bridgeV.y1 = bridgeV.y1 + yMove;
    });
  }
};

const addFlair = (level) => {
  // Add inner boat
  let maxX = 0;
  let maxY = 0;
  forEach(level.islands, (island) => {
    maxX = Math.max(maxX, island.x);
    maxY = Math.max(maxY, island.y);
  });

  // harbors are just any possible islands where the bottom right is (probably) inside the puzzle
  const harbors = shuffle(
    level.islands.filter((island) => island.x < maxX && island.y < maxY)
  );
  const [outerHarbors, innerHarbors] = partition(harbors, (island) =>
    connectedOutside(level, island)
  );
  if (innerHarbors.length > 1) {
    for (let i = 1; i < innerHarbors.length; i++) {
      if (connectedByWater(level, innerHarbors[0], innerHarbors[i])) {
        level.boats = [
          {
            boat: {
              x: innerHarbors[0].x,
              y: innerHarbors[0].y,
            },
            dock: {
              x: innerHarbors[i].x,
              y: innerHarbors[i].y,
            },
          },
        ];
        break;
      }
    }
  }
  if (!level.boats && outerHarbors.length > 1) {
    level.boats = [
      {
        boat: {
          x: outerHarbors[0].x,
          y: outerHarbors[0].y,
        },
        dock: {
          x: outerHarbors[1].x,
          y: outerHarbors[1].y,
        },
      },
    ];
  }

  // TODO: randomly do other types of flair
};

const generateInteresting = (w, h, quiet = false) => {
  const seed = new Date().getTime();
  let loop = 0;
  while (loop < 10000) {
    loop++;
    const attempt = generate(w, h, seed + loop, quiet);
    addFlair(attempt);
    clear(attempt);
    let solutionData = null;
    try {
      solutionData = solve(attempt, true, true);
    } catch (e) {
      quiet || console.log('Rejected for no solution.');
      continue;
    }
    const hSet = new Set(solutionData.heuristicsApplied);
    if (hSet.size < 5) {
      quiet || console.log('Rejected for being boring 1.');
      continue;
    }

    if (!solutionData.heuristicsApplied.find((h) => h > 4)) {
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
    if (!hSet.has(7) && !hSet.has(20) && !hSet.has(25) && !hSet.has(26)) {
      // clear boats if they had no affect on the solution
      quiet || console.log('Removing useless boats.');

      delete attempt.boats;
    }
    clear(attempt);
    if (hasMultipleSolutions(attempt, true)) {
      quiet || console.log('Rejected for multiple solutions.');
      continue;
    }
    clear(attempt);
    solve(attempt, quiet);
    clear(attempt);
    quiet || console.log(yaml.dump(attempt));
    return attempt;
  }
};

const levels = [];
let totalComplexity = 0;
const numLevels = 10;
for (let i = 0; i < numLevels; i++) {
  const level = generateInteresting(9, 9, true);
  if (level) {
    try {
      const { complexity, heuristicsApplied } = solve(level, true, true);
      clear(level);
      levels.push([complexity, level]);
      totalComplexity += complexity;
    } catch (e) {
      // required guessing
    }
  } else {
    console.log('No level generated');
  }
}

levels
  .sort((a, b) => a[0] - b[0])
  // .slice(-5)
  .forEach(([complexity, level]) => {
    solve(level);
    clear(level);
    console.log(yaml.dump(level));
  });

console.log(`Average complexity: ${totalComplexity / numLevels}`);
