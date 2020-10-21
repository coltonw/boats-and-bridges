// the lodash forEach allows returning false to stop it
const { cloneDeep, forEach, find } = require('lodash');
const print = require('./print');
const {
  bridgesLeft,
  bridgeBetween,
  possibleConnections,
  adjacent,
  full,
  addBridge,
  fullyConnected,
  getPossiblyConnectedIslands,
  connectedByWater,
  clear,
  islandPairs,
} = require('./utils');

/**
 * This solver attempts to not just solve a level but also determine how difficult a level is by solving using
 * various heuristics that a human being would use to solve a level.
 */

const addMaxBridge = (level, island0, island1, max = 1) => {
  if (island0.x === island1.x) {
    const maxBridge = {
      x: island0.x,
      y0: Math.min(island0.y, island1.y),
      y1: Math.max(island0.y, island1.y),
      max,
    };
    // Since maxBridges is an artificial level construct, we only add it when needed.
    level.maxBridgesV = level.maxBridgesV || [];
    for (let i = 0; i < level.maxBridgesV.length; i++) {
      if (
        level.maxBridgesV[i].x === maxBridge.x &&
        level.maxBridgesV[i].y0 === maxBridge.y0 &&
        level.maxBridgesV[i].y1 === maxBridge.y1
      ) {
        const changed = max < level.maxBridgesV[i].max;
        level.maxBridgesV[i].max = Math.min(max, level.maxBridgesV[i].max);
        return changed;
      }
    }
    level.maxBridgesV.push(maxBridge);
    return true;
  } else {
    const maxBridge = {
      x0: Math.min(island0.x, island1.x),
      x1: Math.max(island0.x, island1.x),
      y: island0.y,
      max,
    };
    level.maxBridgesH = level.maxBridgesH || [];
    for (let i = 0; i < level.maxBridgesH.length; i++) {
      if (
        level.maxBridgesH[i].x0 === maxBridge.x0 &&
        level.maxBridgesH[i].x1 === maxBridge.x1 &&
        level.maxBridgesH[i].y === maxBridge.y
      ) {
        const changed = max < level.maxBridgesH[i].max;
        level.maxBridgesH[i].max = Math.min(max, level.maxBridgesH[i].max);
        return changed;
      }
    }
    level.maxBridgesH.push(maxBridge);
    return true;
  }
};

const onlyChoiceSimpleHeuristic = (level, island) => {
  let adjacentIsland = null;
  for (let i = 0; i < level.islands.length; i++) {
    if (adjacent(level, island, level.islands[i])) {
      // more than one, so return
      if (adjacentIsland) return false;

      adjacentIsland = level.islands[i];
    }
  }
  if (
    adjacentIsland &&
    possibleConnections(level, island, adjacentIsland) > 0
  ) {
    let n = 1;
    if (island.b && adjacentIsland.b) {
      n = Math.min(bridgesLeft(island), bridgesLeft(adjacentIsland), 2);
    }
    addBridge(level, island, adjacentIsland, n);
    return true;
  } else {
    throw new Error('Unsolvable. Island with no adjacent islands.');
  }
};

// if there is only one island that can connect, connect to that island
const onlyChoiceHeuristic = (level, island) => {
  if (!island.b) {
    return false;
  }
  let adjacentIsland = null;
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0
    ) {
      // more than one, so return
      if (adjacentIsland) return false;

      adjacentIsland = level.islands[i];
    }
  }
  if (adjacentIsland) {
    const n = Math.min(bridgesLeft(island), bridgesLeft(adjacentIsland), 2);
    addBridge(level, island, adjacentIsland, n);
    return true;
  } else {
    throw new Error('Unsolvable. Island with no adjacent islands.');
  }
};

// the adjacent possible bridges fill all remaining bridges needed
const onlyChoicesHeuristic = (level, island) => {
  if (!island.b) {
    return false;
  }
  let adjacentIslands = [];
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0
    ) {
      adjacentIslands.push(level.islands[i]);
    }
  }
  const bridgeOptionsSum = adjacentIslands.reduce(
    (sum, aI) => sum + possibleConnections(level, island, aI),
    0
  );
  if (bridgeOptionsSum <= bridgesLeft(island)) {
    adjacentIslands.forEach((adjacentIsland) => {
      addBridge(
        level,
        island,
        adjacentIsland,
        possibleConnections(level, island, adjacentIsland)
      );
    });
    return true;
  }
  return false;
};

// Right now this is simple.  It just adds max bridges.
// it may be possible to generalize this but for now this just works for 2s next to each other and 1s next to each other
const noStrandedIslandsSimpleHeuristic = (level, island) => {
  if (!island.b || island.b > 2) {
    return false;
  }
  let adjacentIslands = [];
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0
    ) {
      adjacentIslands.push(level.islands[i]);
    }
  }
  let found = false;

  adjacentIslands.forEach((adjacentIsland) => {
    if (island.b === adjacentIsland.b) {
      const changed = addMaxBridge(level, island, adjacentIsland, island.b - 1);
      found = found || changed;
    }
  });
  return found;
};

// if there are so many bridges required that you MUST have 1 point to each adjacent island
const moreBridgesThanChoicesHeuristic = (level, island) => {
  if (!island.b) {
    return false;
  }
  let adjacentIslands = [];
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0
    ) {
      adjacentIslands.push(level.islands[i]);
    }
  }

  const notConnected = adjacentIslands.filter(
    (aI) => !bridgeBetween(level, island, aI)
  );

  if (
    notConnected.length > 0 &&
    adjacentIslands.length * 2 - 1 <=
      bridgesLeft(island) + adjacentIslands.length - notConnected.length
  ) {
    notConnected.forEach((adjacentIsland) => {
      addBridge(level, island, adjacentIsland, 1);
    });
    return true;
  }
  return false;
};

const noBlockedBoatsHeuristic = (level, island) => {
  if (!level.boats) {
    return false;
  }
  let adjacentIslands = [];
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0
    ) {
      adjacentIslands.push(level.islands[i]);
    }
  }
  let found = false;

  adjacentIslands.forEach((adjacentIsland) => {
    const levelClone = cloneDeep(level);
    const islandClone = levelClone.islands.find(
      (i) => i.x === island.x && i.y === island.y
    );
    const adjacentClone = levelClone.islands.find(
      (i) => i.x === adjacentIsland.x && i.y === adjacentIsland.y
    );
    addBridge(levelClone, islandClone, adjacentClone);
    let strandedBoat = false;
    forEach(level.boats, ({ boat, dock }) => {
      const connected = connectedByWater(levelClone, boat, dock);
      if (!connected) {
        strandedBoat = true;
        return false;
      }
    });
    if (strandedBoat) {
      const changed = addMaxBridge(level, island, adjacentIsland, 0);
      found = found || changed;
    }
  });
  return found;
};

// if you can only have a single bridge to some of the adjecent bridges it may mean you MUST put a bridge on other islands
// this is a somewhat more complex moreBridgesThanChoicesHeuristic
const pigeonholeHeuristic = (level, island) => {
  if (!island.b) {
    return;
  }
  let adjacentIslands = [];
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0
    ) {
      adjacentIslands.push(level.islands[i]);
    }
  }
  const singleLinkOptions = adjacentIslands.reduce(
    (sum, aI) => sum + (possibleConnections(level, island, aI) === 1 ? 1 : 0),
    0
  );
  if (
    (adjacentIslands.length - singleLinkOptions) * 2 - 1 <=
      bridgesLeft(island) - singleLinkOptions &&
    singleLinkOptions < adjacentIslands.length
  ) {
    adjacentIslands.forEach((adjacentIsland) => {
      if (possibleConnections(level, island, adjacentIsland) > 1) {
        addBridge(level, island, adjacentIsland, 1);
      }
    });
    return true;
  }
  return false;
};

// there are a few possible variations of stranded island heuristics:
// 1. Must connect or stranded:
//    A - X   X - B   Where A and B CANNOT connect via any other links
const noStrandedIslandsAdvanced1Heuristic = (level, island) => {
  let adjacentIslands = [];
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0 &&
      !bridgeBetween(level, island, level.islands[i])
    ) {
      adjacentIslands.push(level.islands[i]);
    }
  }

  let found = false;
  adjacentIslands.forEach((adjacentIsland) => {
    const myIslands = getPossiblyConnectedIslands(level, island, [
      adjacentIsland,
    ]);
    const yourIslands = getPossiblyConnectedIslands(level, adjacentIsland, [
      island,
    ]);
    let intersect = false;
    for (let i = 0; i < myIslands.length; i++) {
      if (
        yourIslands.find(
          (yI) => yI.x === myIslands[i].x && yI.y === myIslands[i].y
        )
      ) {
        intersect = true;
        break;
      }
    }
    if (!intersect) {
      addBridge(level, island, adjacentIsland, 1);
      found = true;
    }
  });
  return found;
};

// 2. Must max bridge or stranded:
//    A - A
//
//    X   X - B
//    |       |
//    B - B - B   Where A and B CANNOT connect via any other links
const noStrandedIslandsAdvanced2Heuristic = (level, island) => {
  let adjacentIslands = [];
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0
    ) {
      adjacentIslands.push(level.islands[i]);
    }
  }

  let found = false;
  adjacentIslands.forEach((adjacentIsland) => {
    const levelClone = cloneDeep(level);
    const islandClone = levelClone.islands.find(
      (i) => i.x === island.x && i.y === island.y
    );
    const adjacentClone = levelClone.islands.find(
      (i) => i.x === adjacentIsland.x && i.y === adjacentIsland.y
    );
    addBridge(levelClone, islandClone, adjacentClone);
    const connectedIslands = getPossiblyConnectedIslands(
      levelClone,
      islandClone
    );
    if (connectedIslands.length < level.islands.length) {
      const changed = addMaxBridge(
        level,
        island,
        adjacentIsland,
        bridgeBetween(level, island, adjacentIsland)
          ? 1
          : possibleConnections(level, island, adjacentIsland) - 1
      );
      found = found || changed;
    }
  });
  return found;
};

// TODO:
// Unfillable island pigeonhole
//    A   X   B
//
//        B   Y  Putting remaining bridges at the Bs would cause Y to be unfillable, so you must connect to A

// TODO:
// No stranded pigeonhole:
//    A ----- A
//
//    B - X - B  Where the only 2 (or even 3?!) possible links are all adjacent to one island,
//
//        Y      Which means that island X is pigeonholed to connect to Y
// 5. Narrow guess, only 2 islands can connect so you must pick one of those 2

// TODO
// This is for a situation where multiple bridges together would block a boat which pigeonholes bridges onto all the islands that are not one of those
// Z   X   Y  X cannot connect to both Ys because it blocks the boat, so it MUST connect to Z
//       b |
//     Y - ?
const noBlockedBoatsPigeonholeHeuristic = (advanced) => (level, island) => {
  // WIP
  if (!level.boats || !island.b) {
    return false;
  }
  let adjacentIslands = [];
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0
    ) {
      adjacentIslands.push(level.islands[i]);
    }
  }
  const disconnectedIslands = adjacentIslands.filter(
    (aI) => !bridgeBetween(level, island, aI)
  );
  let found = false;
  const pairs = islandPairs(disconnectedIslands);
  pairs.forEach(([aI1, aI2]) => {
    const levelClone = cloneDeep(level);
    const islandClone = levelClone.islands.find(
      (i) => i.x === island.x && i.y === island.y
    );
    const aI1Clone = levelClone.islands.find(
      (i) => i.x === aI1.x && i.y === aI1.y
    );
    addBridge(levelClone, islandClone, aI1Clone);
    const aI2Clone = levelClone.islands.find(
      (i) => i.x === aI2.x && i.y === aI2.y
    );
    addBridge(levelClone, islandClone, aI2Clone);
    let strandedBoat = false;
    forEach(level.boats, ({ boat, dock }) => {
      const connected = connectedByWater(levelClone, boat, dock);
      if (!connected) {
        strandedBoat = true;
        return false;
      }
    });
    if (strandedBoat) {
      // there are three situations here
      // 1. bridgesLeft - (max bridges to one blocking island) is equal to all bridges in the non-blocking islands, so we just fill them up
      // 2. bridgesLeft - (max bridges to one blocking island) is greater than non-blocking islands possible choices (aka 1 for 1 non-blocking island or 3 for 2 non-blocking islands)
      // 3. ADVANCED ONLY - bridgesLeft - (max bridges to one blocking island) is 2 and there is one non-blocking island with only 1 possible connection, then a bridge is pigeonholed onto the other island
      //    Separated the advanced one because it is more complicated
      const nonBlockingIslands = adjacentIslands.filter(
        (aI) =>
          !(
            (aI.x === aI1.x && aI.y === aI1.y) ||
            (aI.x === aI2.x && aI.y === aI2.y)
          )
      );
      const possibleBridges = nonBlockingIslands.reduce(
        (s, aI) => s + possibleConnections(level, island, aI),
        0
      );
      const maxBlockingBridges = Math.max(
        possibleConnections(level, island, aI1),
        possibleConnections(level, island, aI2)
      );
      // 1
      if (bridgesLeft(island) - maxBlockingBridges === possibleBridges) {
        nonBlockingIslands.forEach((nBI) => {
          const changed = addBridge(
            level,
            island,
            nBI,
            possibleConnections(level, island, nBI)
          );
          found = found || changed;
        });
      } else if (
        bridgesLeft(island) - maxBlockingBridges >
        (adjacentIslands.length - 3) * 2
      ) {
        // 2
        nonBlockingIslands.forEach((aI) => {
          const changed = addBridge(level, island, aI, 1);
          found = found || changed;
        });
      } else if (
        advanced &&
        bridgesLeft(island) - maxBlockingBridges === 2 &&
        nonBlockingIslands.find(
          (nBI) => possibleConnections(level, island, nBI) === 1
        )
      ) {
        // 3
        const pigeonholed = nonBlockingIslands.find(
          (nBI) => possibleConnections(level, island, nBI) === 2
        );
        if (pigeonholed) {
          const changed = addBridge(level, island, pigeonholed, 1);
          found = found || changed;
        }
      }
    }
  });
  return found;
};

// guess each bridge and see if it is solveable with them
const guessAndCheck = (nested) => (level, island) => {
  let adjacentIslands = [];
  // TODO: for efficiency we could only check adjacency to islands with a greater index than ourselves.
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0
    ) {
      adjacentIslands.push(level.islands[i]);
    }
  }
  let found = false;
  forEach(adjacentIslands, (adjacentIsland) => {
    try {
      const levelClone = cloneDeep(level);
      const islandClone = levelClone.islands.find(
        ({ x, y }) => island.x === x && island.y === y
      );
      const adjacentIslandClone = levelClone.islands.find(
        ({ x, y }) => adjacentIsland.x === x && adjacentIsland.y === y
      );
      addBridge(levelClone, islandClone, adjacentIslandClone, 1);
      // if we want nesting, we enable guessing on the solve
      solve(levelClone, true, !nested);
      if (fullyConnected(levelClone)) {
        addBridge(level, island, adjacentIsland, 1);
        found = true;
        return false;
      }
    } catch (e) {}
  });
  return found;
};

const solved = (level) =>
  level.islands.reduce(
    (s, island) => s && (!island.b || island.b === island.n),
    true
  ) &&
  (!level.boats ||
    level.boats.reduce(
      (s, { boat, dock }) => s && connectedByWater(level, boat, dock),
      true
    ));

const heuristics = [
  onlyChoiceSimpleHeuristic, // 0
  onlyChoiceHeuristic, // 1
  onlyChoicesHeuristic, // 2
  noStrandedIslandsSimpleHeuristic, // 3
  moreBridgesThanChoicesHeuristic, // 4
  noBlockedBoatsHeuristic, // 5
  pigeonholeHeuristic, // 6
  noStrandedIslandsAdvanced1Heuristic, // 7
  noStrandedIslandsAdvanced2Heuristic, // 8
  noBlockedBoatsPigeonholeHeuristic(false), // 9
  noBlockedBoatsPigeonholeHeuristic(true), // 10
  guessAndCheck(false), // 11
  guessAndCheck(true), // 12
];

const solve = (
  level,
  quiet = false,
  noGuessing = false,
  noNestedGuessing = false
) => {
  quiet || console.log('Unsolved:');
  quiet || print(level);
  let solutionData = {
    loops: 0,
    heuristicsApplied: [],
  };
  while (!solved(level)) {
    solutionData.loops++;
    let somethingChanged = false;
    const heurLen =
      heuristics.length - (noGuessing ? 2 : noNestedGuessing ? 1 : 0);
    // Probably in the future we will need to have heuristics check more than just one island at a time, but for now this works
    for (let h = 0; h < heurLen; h++) {
      forEach(level.islands, (island) => {
        if (!full(island)) {
          const clonedLevel = cloneDeep(level);
          const heuristicWorked = heuristics[h](level, island);
          if (heuristicWorked) {
            if (!quiet && h >= heuristics.length - 2) {
              console.log('Before guess:');
              print(clonedLevel);
            }
            solutionData.heuristicsApplied.push(h);
            somethingChanged = true;
            return false;
          }
        }
      });
      // We want to keep repeating with the easiest heuristics until there is "no choice" but to use the more complex ones
      if (somethingChanged) break;
    }
    if (!somethingChanged) {
      quiet ||
        console.log(
          `Level thus far (${solutionData.loops} loops; heuristics: ${solutionData.heuristicsApplied}):`
        );
      quiet || print(level);
      throw new Error('Level unsolvable with current set of heuristics');
    }
    if (solutionData.loops > 200) {
      console.log(
        `Broken heuristic: ${solutionData.heuristicsApplied.slice(-10)}`
      );
      throw new Error('Suspected infinite loop');
    }
  }
  solutionData.complexity =
    solutionData.heuristicsApplied.reduce((s, n) => s + n) /
    solutionData.heuristicsApplied.length;
  quiet ||
    console.log(
      `Solved (${solutionData.loops} loops; heuristics: ${solutionData.heuristicsApplied}, complexity: ${solutionData.complexity}):`
    );
  quiet || print(level);
  return solutionData;
};

// TODO: Add other mechanics AKA questions marks or boats or whatever

module.exports = solve;

solve.heuristics = heuristics;

solve.hasMultipleSolutions = (level, quiet = false) => {
  const solvedLevel = cloneDeep(level);
  solve(solvedLevel, true);
  let found = false;
  forEach(level.islands, (island, i) => {
    let adjacentIslands = [];
    for (let j = 0; j < level.islands.length; j++) {
      if (adjacent(level, island, level.islands[j])) {
        const bridge = bridgeBetween(
          solvedLevel,
          solvedLevel.islands[i],
          solvedLevel.islands[j]
        );
        if (
          !bridge ||
          (bridge.n === 1 && island.b > 1 && level.islands[j].b > 1)
        ) {
          adjacentIslands.push(level.islands[j]);
        }
      }
    }
    forEach(adjacentIslands, (adjacentIsland) => {
      try {
        const bridge = bridgeBetween(
          solvedLevel,
          solvedLevel.islands[i],
          solvedLevel.islands.find(
            ({ x, y }) => adjacentIsland.x === x && adjacentIsland.y === y
          )
        );
        const numBridges = bridge ? 2 : 1;
        clear(level);
        addBridge(level, island, adjacentIsland, numBridges);
        solve(level, true);
        if (fullyConnected(level)) {
          found = true;
          quiet || console.log('Other solution:');
          quiet || print(level);
          return false;
        }
      } catch (e) {}
    });
    if (found) {
      return false;
    }
  });
  return found;
};
