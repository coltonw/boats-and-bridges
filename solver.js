// the lodash forEach allows returning false to stop it
const { cloneDeep, forEach } = require('lodash');
const print = require('./print');

/**
 * This solver attempts to not just solve a level but also determine how difficult a level is by solving using
 * various heuristics that a human being would use to solve a level.
 */

const bridgeBetween = (level, island0, island1) => {
  let bridge = null;
  if (island0.x === island1.x) {
    forEach(level.bridgesV, (bridgeV) => {
      if (
        bridgeV.x === island0.x &&
        bridgeV.y0 === Math.min(island0.y, island1.y) &&
        bridgeV.y1 === Math.max(island0.y, island1.y)
      ) {
        bridge = bridgeV;
        return false;
      }
    });
  }
  if (island0.y === island1.y) {
    forEach(level.bridgesH, (bridgeH) => {
      if (
        bridgeH.y === island0.y &&
        bridgeH.x0 === Math.min(island0.x, island1.x) &&
        bridgeH.x1 === Math.max(island0.x, island1.x)
      ) {
        bridge = bridgeH;
        return false;
      }
    });
  }
  return bridge;
};

// TODO: use bridgeBetween to simplify this function
const possibleConnections = (level, island0, island1) => {
  let maxMax = 2;
  if (island0.x === island1.x) {
    if (level.maxBridgesV) {
      forEach(level.maxBridgesV, (maxBridgeV) => {
        if (
          maxBridgeV.x === island0.x &&
          maxBridgeV.y0 === Math.min(island0.y, island1.y) &&
          maxBridgeV.y1 === Math.max(island0.y, island1.y)
        ) {
          maxMax = Math.min(maxMax, maxBridgeV.max);
          return false;
        }
      });
    }

    forEach(level.bridgesV, (bridgeV) => {
      if (
        bridgeV.x === island0.x &&
        bridgeV.y0 === Math.min(island0.y, island1.y) &&
        bridgeV.y1 === Math.max(island0.y, island1.y)
      ) {
        maxMax = Math.min(maxMax, 2 - bridgeV.n);
        return false;
      }
    });
  }
  if (island0.y === island1.y) {
    if (level.maxBridgesH) {
      forEach(level.maxBridgesH, (maxBridgeH) => {
        if (
          maxBridgeH.y === island0.y &&
          maxBridgeH.x0 === Math.min(island0.x, island1.x) &&
          maxBridgeH.x1 === Math.max(island0.x, island1.x)
        ) {
          maxMax = Math.min(maxMax, maxBridgeH.max);
          return false;
        }
      });
    }

    forEach(level.bridgesH, (bridgeH) => {
      if (
        bridgeH.y === island0.y &&
        bridgeH.x0 === Math.min(island0.x, island1.x) &&
        bridgeH.x1 === Math.max(island0.x, island1.x)
      ) {
        maxMax = Math.min(maxMax, 2 - bridgeH.n);
        return false;
      }
    });
  }
  return Math.min(island0.b - island0.n, island1.b - island1.n, maxMax);
};

const vertAdjacent = (level, island0, island1) => {
  if (island0.x === island1.x && island0.y !== island1.y) {
    // check if there are any islands in the way
    for (let i = 0; i < level.islands.length; i++) {
      if (
        level.islands[i].x === island0.x &&
        ((level.islands[i].y < island0.y && level.islands[i].y > island1.y) ||
          (level.islands[i].y > island0.y && level.islands[i].y < island1.y))
      ) {
        return false;
      }
    }
    // check if there are any bridges in the way
    for (let i = 0; i < level.bridgesH.length; i++) {
      if (
        ((level.bridgesH[i].y < island0.y && level.bridgesH[i].y > island1.y) ||
          (level.bridgesH[i].y > island0.y &&
            level.bridgesH[i].y < island1.y)) &&
        level.bridgesH[i].x0 < island0.x &&
        level.bridgesH[i].x1 > island0.x
      ) {
        return false;
      }
    }
    // nothing in the way, they must be adjacent
    return true;
  }
  return false;
};

const horAdjacent = (level, island0, island1) => {
  if (island0.y === island1.y && island0.x !== island1.x) {
    for (let i = 0; i < level.islands.length; i++) {
      if (
        level.islands[i].y === island0.y &&
        ((level.islands[i].x < island0.x && level.islands[i].x > island1.x) ||
          (level.islands[i].x > island0.x && level.islands[i].x < island1.x))
      ) {
        return false;
      }
    }
    for (let i = 0; i < level.bridgesV.length; i++) {
      if (
        ((level.bridgesV[i].x < island0.x && level.bridgesV[i].x > island1.x) ||
          (level.bridgesV[i].x > island0.x &&
            level.bridgesV[i].x < island1.x)) &&
        level.bridgesV[i].y0 < island0.y &&
        level.bridgesV[i].y1 > island0.y
      ) {
        return false;
      }
    }
    return true;
  }
  return false;
};

const adjacent = (level, island0, island1) => {
  return (
    vertAdjacent(level, island0, island1) ||
    horAdjacent(level, island0, island1)
  );
};

const full = (island) => island.n >= island.b;

const addBridge = (level, island0, island1, n = 1) => {
  if (island0.x === island1.x) {
    const bridge = {
      x: island0.x,
      y0: Math.min(island0.y, island1.y),
      y1: Math.max(island0.y, island1.y),
      n,
    };
    let found = false;
    for (let i = 0; i < level.bridgesV.length; i++) {
      if (
        level.bridgesV[i].x === bridge.x &&
        level.bridgesV[i].y0 === bridge.y0 &&
        level.bridgesV[i].y1 === bridge.y1
      ) {
        if (level.bridgesV[i].n + n > 2) {
          throw new Error('Too many bridges');
        }
        level.bridgesV[i].n += n;
        found = true;
        break;
      }
    }
    if (!found) {
      level.bridgesV.push(bridge);
    }
  } else {
    const bridge = {
      x0: Math.min(island0.x, island1.x),
      x1: Math.max(island0.x, island1.x),
      y: island0.y,
      n,
    };
    let found = false;
    for (let i = 0; i < level.bridgesH.length; i++) {
      if (
        level.bridgesH[i].x0 === bridge.x0 &&
        level.bridgesH[i].x1 === bridge.x1 &&
        level.bridgesH[i].y === bridge.y
      ) {
        if (level.bridgesH[i].n + n > 2) {
          throw new Error('Too many bridges');
        }
        level.bridgesH[i].n += n;
        found = true;
        break;
      }
    }
    if (!found) {
      level.bridgesH.push(bridge);
    }
  }
  island0.n += n;
  island1.n += n;
};

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

// if there is only one island that can connect, connect to that island
const onlyChoiceHeuristic = (level, island) => {
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
    const n = Math.min(
      island.b - island.n,
      adjacentIsland.b - adjacentIsland.n,
      2
    );
    addBridge(level, island, adjacentIsland, n);
    return true;
  } else {
    throw new Error('Unsolvable. Island with no adjacent islands.');
  }
};

// if the adjacent possible bridges left fill all remaining bridges needed
const onlyChoicesHeuristic = (level, island) => {
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
  if (bridgeOptionsSum <= island.b - island.n) {
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
  if (island.b > 2) {
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
  let adjacentIslands = [];
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0
    ) {
      adjacentIslands.push(level.islands[i]);
    }
  }
  if (adjacentIslands.length * 2 - 1 <= island.b - island.n) {
    adjacentIslands.forEach((adjacentIsland) => {
      addBridge(level, island, adjacentIsland, 1);
    });
    return true;
  }
  return false;
};

// if you can only have a single bridge to some of the adjecent bridges it may mean you MUST put a bridge on other islands
// this is a somewhat more complex moreBridgesThanChoicesHeuristic
const pigeonholeHeuristic = (level, island) => {
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
      island.b - island.n - singleLinkOptions &&
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

// guess each bridge and see if it is solveable with them
// this could break certain levels because it won't pay attention
// to making sure all islands are connected
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
  level.islands.reduce((s, island) => s && island.b === island.n, true);

const connectedIslands = (level, island) => {
  const result = [];
  level.bridgesH.forEach((bridgeH) => {
    if (bridgeH.x0 === island.x && bridgeH.y === island.y) {
      const connected = level.islands.find(
        (i) => i.x === bridgeH.x1 && i.y === bridgeH.y
      );
      if (!connected) {
        throw new Error(`Bridge connected to nothing: ${bridgeH}`);
      }
      result.push(connected);
    }
    if (bridgeH.x1 === island.x && bridgeH.y === island.y) {
      const connected = level.islands.find(
        (i) => i.x === bridgeH.x0 && i.y === bridgeH.y
      );
      if (!connected) {
        throw new Error(`Bridge connected to nothing: ${bridgeH}`);
      }
      result.push(connected);
    }
  });
  level.bridgesV.forEach((bridgeV) => {
    if (bridgeV.x === island.x && bridgeV.y0 === island.y) {
      const connected = level.islands.find(
        (i) => i.x === bridgeV.x && i.y === bridgeV.y1
      );
      if (!connected) {
        throw new Error(`Bridge connected to nothing: ${bridgeV}`);
      }
      result.push(connected);
    }
    if (bridgeV.x === island.x && bridgeV.y1 === island.y) {
      const connected = level.islands.find(
        (i) => i.x === bridgeV.x && i.y === bridgeV.y0
      );
      if (!connected) {
        throw new Error(`Bridge connected to nothing: ${bridgeV}`);
      }
      result.push(connected);
    }
  });
  return result;
};

const fullyConnected = (level) => {
  const traversingStack = [level.islands[0]];
  const visited = [level.islands[0]];

  while (traversingStack.length > 0) {
    const island = traversingStack.pop();
    const connected = connectedIslands(level, island);
    connected.forEach((cI) => {
      if (!visited.find((i) => i.x === cI.x && i.y === cI.y)) {
        visited.push(cI);
        traversingStack.unshift(cI);
      }
    });
  }

  return visited.length === level.islands.length;
};

const heuristics = [
  onlyChoiceHeuristic,
  onlyChoicesHeuristic,
  noStrandedIslandsSimpleHeuristic,
  moreBridgesThanChoicesHeuristic,
  pigeonholeHeuristic,
  guessAndCheck(false),
  guessAndCheck(true),
];

const solve = (level, quiet = false, noGuessing = false) => {
  quiet || console.log('Unsolved:');
  quiet || print(level);
  let solutionData = {
    loops: 0,
    heuristicsApplied: [],
  };
  while (!solved(level)) {
    solutionData.loops++;
    let somethingChanged = false;
    const heurLen = heuristics.length - (noGuessing ? 2 : 0);
    // Probably in the future we will need to have heuristics check more than just one island at a time, but for now this works
    for (let h = 0; h < heurLen; h++) {
      forEach(level.islands, (island) => {
        if (!full(island)) {
          const heuristicWorked = heuristics[h](level, island);
          if (heuristicWorked) {
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
    if (solutionData.loops > 40) {
      quiet ||
        console.log(
          `Broken heuristic: ${solutionData.heuristicsApplied.slice(-10)}`
        );
      throw new Error('Suspected infinite loop');
    }
  }
  quiet ||
    console.log(
      `Solved (${solutionData.loops} loops; heuristics: ${solutionData.heuristicsApplied}):`
    );
  quiet || print(level);
};

// TODO: Add other mechanics AKA questions marks or boats or whatever

module.exports = solve;

solve.hasMultipleSolutions = (level) => {
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
        const levelClone = cloneDeep(level);
        const islandClone = levelClone.islands.find(
          ({ x, y }) => island.x === x && island.y === y
        );
        const adjacentIslandClone = levelClone.islands.find(
          ({ x, y }) => adjacentIsland.x === x && adjacentIsland.y === y
        );
        const bridge = bridgeBetween(
          solvedLevel,
          solvedLevel.islands[i],
          solvedLevel.islands.find(
            ({ x, y }) => adjacentIsland.x === x && adjacentIsland.y === y
          )
        );
        const numBridges = bridge ? 2 : 1;
        addBridge(levelClone, islandClone, adjacentIslandClone, numBridges);
        solve(levelClone, true);
        if (fullyConnected(levelClone)) {
          found = true;
          console.log('Other solution:');
          print(levelClone);
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
