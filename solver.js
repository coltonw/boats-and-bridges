// the lodash forEach allows returning false to stop it
const { cloneDeep, forEach, partition } = require('lodash');
const print = require('./print');
const {
  bridgesLeft,
  bridgeBetween,
  possibleConnections,
  adjacent,
  full,
  addBridge,
  removeBridge,
  validated,
  getPossiblyConnectedIslands,
  connectedByWater,
  getMustConnectWater,
  clear,
  islandPairs,
  islandTriples,
  getAdjacentIslands,
  getTotalConnectedBridges,
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
    if (island.b && adjacentIsland.b) {
      const n = Math.min(bridgesLeft(island), bridgesLeft(adjacentIsland), 2);
      addBridge(level, island, adjacentIsland, n);
    } else if (island.b || !bridgeBetween(level, island, adjacentIsland)) {
      addBridge(level, island, adjacentIsland, 1);
    } else {
      return false;
    }
    return true;
  } else if (island.b) {
    throw new Error('Unsolvable. Island with no adjacent islands.');
  } else {
    return false;
  }
};

// if there is only one island that can connect, connect to that island
const onlyChoiceHeuristic = (level, island, islandData) => {
  if (!island.b) {
    return false;
  }
  const { adjacentIslands } = islandData;

  if (adjacentIslands.length === 1) {
    const n = Math.min(bridgesLeft(island), bridgesLeft(adjacentIslands[0]), 2);
    addBridge(level, island, adjacentIslands[0], n);
    return true;
  } else if (adjacentIslands.length === 0) {
    throw new Error('Unsolvable. Island with no adjacent islands.');
  }
  return false;
};

// the adjacent possible bridges fill all remaining bridges needed
const onlyChoicesHeuristic = (level, island, islandData) => {
  if (!island.b) {
    return false;
  }
  const { adjacentIslands } = islandData;
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
const noStrandedIslandsSimpleHeuristic = (level, island, islandData) => {
  if (!island.b || island.b > 2) {
    return false;
  }
  const { adjacentIslands } = islandData;
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
const moreBridgesThanChoicesHeuristic = (level, island, islandData) => {
  if (!island.b) {
    return false;
  }
  const { adjacentIslands } = islandData;

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

const noBlockedBoatsHeuristic = (level, island, islandData) => {
  if (!level.boats) {
    return false;
  }
  const { adjacentIslands } = islandData;
  let found = false;

  adjacentIslands.forEach((adjacentIsland) => {
    addBridge(level, island, adjacentIsland);
    let strandedBoat = false;
    forEach(level.boats, ({ boat, dock }) => {
      const connected = connectedByWater(level, boat, dock);
      if (!connected) {
        strandedBoat = true;
        return false;
      }
    });
    if (strandedBoat) {
      const changed = addMaxBridge(level, island, adjacentIsland, 0);
      found = found || changed;
    }
    removeBridge(level, island, adjacentIsland);
  });
  return found;
};

// if you can only have a single bridge to some of the adjecent bridges it may mean you MUST put a bridge on other islands
// this is a somewhat more complex moreBridgesThanChoicesHeuristic
const pigeonholeHeuristic = (level, island, islandData) => {
  if (!island.b) {
    return;
  }
  const { adjacentIslands } = islandData;
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

// Stranded island heuristic:
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

// Stranded island heuristic:
// 2. Must max bridge or stranded:
//    A - A
//
//    X   X - B
//    |       |
//    B - B - B   Where A and B CANNOT connect via any other links
const noStrandedIslandsAdvanced2Heuristic = (level, island, islandData) => {
  const { adjacentIslands } = islandData;

  let found = false;
  adjacentIslands.forEach((adjacentIsland) => {
    const maxAmount = bridgeBetween(level, island, adjacentIsland)
      ? 1
      : possibleConnections(level, island, adjacentIsland) - 1;
    addBridge(level, island, adjacentIsland);
    const connectedIslands = getPossiblyConnectedIslands(level, island);
    if (connectedIslands.length < level.islands.length) {
      const changed = addMaxBridge(level, island, adjacentIsland, maxAmount);
      found = found || changed;
    }
    removeBridge(level, island, adjacentIsland);
  });
  return found;
};

// X   Y   There must be a bridge between X and Y to prevent the pirate
// | b | p
// A - A
const noPiratedBoatsHeuristic = (level, island, islandData) => {
  if (!level.boats || !level.pirates) {
    return false;
  }
  const { adjacentIslands } = islandData;
  let found = false;

  adjacentIslands.forEach((adjacentIsland) => {
    if (bridgeBetween(level, island, adjacentIsland)) {
      return;
    }
    const bridge =
      island.x === adjacentIsland.x
        ? {
            x: island.x,
            y0: Math.min(island.y, adjacentIsland.y),
            y1: Math.max(island.y, adjacentIsland.y),
          }
        : {
            x0: Math.min(island.x, adjacentIsland.x),
            x1: Math.max(island.x, adjacentIsland.x),
            y: island.y,
          };
    let piratePrevented = false;
    forEach(level.pirates, (pirate) => {
      const unbridgedPiratedWaters = getMustConnectWater(level, pirate, [
        bridge,
      ]);
      const bridgedPiratedWaters = getMustConnectWater(level, pirate, []);
      forEach(level.boats, ({ boat }) => {
        if (
          unbridgedPiratedWaters.find(
            ({ x, y }) => boat.x === x && boat.y === y
          ) &&
          !bridgedPiratedWaters.find(({ x, y }) => boat.x === x && boat.y === y)
        ) {
          piratePrevented = true;
          return false;
        }
      });
      if (piratePrevented) {
        return false;
      }
    });
    if (piratePrevented) {
      addBridge(level, island, adjacentIsland);
      found = true;
    }
  });
  return found;
};

// X   A   The bridge between X and Y makes it impossible to block the pirate, so you must add a max bridge
// |   | p
// Y   A
// | b |
// B - B
const noPiratedBoatsPreventBridgeHeuristic = (level, island, islandData) => {
  if (!level.boats || !level.pirates) {
    return false;
  }
  const { adjacentIslands } = islandData;
  let found = false;

  adjacentIslands.forEach((adjacentIsland) => {
    addBridge(level, island, adjacentIsland);
    let piratedBoat = false;
    forEach(level.pirates, (pirate) => {
      const piratedWaters = getMustConnectWater(level, pirate, []);
      forEach(level.boats, ({ boat }) => {
        if (piratedWaters.find(({ x, y }) => boat.x === x && boat.y === y)) {
          piratedBoat = true;
          return false;
        }
      });
      if (piratedBoat) {
        return false;
      }
    });
    removeBridge(level, island, adjacentIsland);
    if (piratedBoat) {
      const changed = addMaxBridge(
        level,
        island,
        adjacentIsland,
        bridgeBetween(level, island, adjacentIsland) ? 1 : 0
      );
      found = found || changed;
    }
  });
  return found;
};

// Unfillable island pigeonhole
//    A   X   B
//
//        B   Y  Putting remaining bridges at the Bs would cause Y to be unfillable, so you must connect to A
const unfillableIslandPigeonholeHeuristic = (advanced) => (
  level,
  island,
  islandData,
  levelData
) => {
  if (!level.boats || !island.b) {
    return false;
  }
  const adjacentIslands = islandData.adjacentIslands.filter((aI) => aI.b);
  let found = false;
  const pairs = islandPairs(adjacentIslands, true);
  pairs.forEach(([aI1, aI2]) => {
    const fIX = aI1.x !== island.x ? aI1.x : aI2.x;
    const fIY = aI1.y !== island.y ? aI1.y : aI2.y;
    const farIsland = level.islands.find((fI) => fI.x === fIX && fI.y === fIY);
    if (
      farIsland &&
      farIsland.b &&
      adjacent(level, aI1, farIsland) &&
      adjacent(level, aI2, farIsland)
    ) {
      const otherIslands = getIslandData(
        level,
        farIsland,
        levelData
      ).adjacentIslands.filter(
        (oI) =>
          !(
            (oI.x === aI1.x && oI.y === aI1.y) ||
            (oI.x === aI2.x && oI.y === aI2.y)
          )
      );
      const otherConnections = otherIslands.reduce(
        (s, oI) => s + possibleConnections(level, oI, farIsland),
        0
      );

      const filledBridgesLeft1 =
        bridgesLeft(aI1) - possibleConnections(level, island, aI1);
      const filledBridgesLeft2 =
        bridgesLeft(aI2) -
        Math.min(
          possibleConnections(level, island, aI2),
          bridgesLeft(island) - possibleConnections(level, island, aI1)
        );

      if (
        filledBridgesLeft1 + filledBridgesLeft2 >=
        bridgesLeft(farIsland) - otherConnections
      ) {
        return;
      }

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
      const fillElsewhereBridges =
        bridgesLeft(farIsland) -
        otherConnections -
        (filledBridgesLeft1 + filledBridgesLeft2);

      // 1
      if (fillElsewhereBridges === possibleBridges) {
        nonBlockingIslands.forEach((nBI) => {
          addBridge(
            level,
            island,
            nBI,
            possibleConnections(level, island, nBI)
          );
          found = true;
        });
      } else if (fillElsewhereBridges > (adjacentIslands.length - 3) * 2) {
        // 2
        nonBlockingIslands.forEach((aI) => {
          addBridge(level, island, aI, 1);
          found = true;
        });
      } else if (
        advanced &&
        fillElsewhereBridges === 2 &&
        nonBlockingIslands.find(
          (nBI) => possibleConnections(level, island, nBI) === 1
        )
      ) {
        // 3
        const pigeonholed = nonBlockingIslands.find(
          (nBI) => possibleConnections(level, island, nBI) === 2
        );
        if (pigeonholed) {
          addBridge(level, island, pigeonholed, 1);
          found = true;
        }
      }
    }
  });
  return found;
};

// This is for a situation where multiple bridges together would cause unfillable island so you must pigeonhole to other islands
//    A ----- A
//
//    B - X - B  Where the only 2 (or even 3?!) possible links are all adjacent to one island,
//
//        Y      Which means that island X is pigeonholed to connect to Y
const noStrandedIslandsAdvanced3Heuristic = (advanced) => (
  level,
  island,
  islandData
) => {
  if (!level.boats || !island.b) {
    return false;
  }
  const { adjacentIslands } = islandData;
  let found = false;
  // If an island can take all remaining bridges, then it is not useful for a pair in this heuristic
  const possibleStranders = adjacentIslands.filter(
    (aI) => possibleConnections(level, island, aI) < bridgesLeft(island)
  );
  // TODO: this with triples?
  const pairs = islandPairs(possibleStranders);
  forEach(pairs, ([aI1, aI2]) => {
    let stranders = false;
    const aI1N = possibleConnections(level, island, aI1);
    addBridge(level, island, aI1, aI1N);
    const aI2N = possibleConnections(level, island, aI2);
    addBridge(level, island, aI2, aI2N);
    const connectedIslands = getPossiblyConnectedIslands(level, island);
    if (connectedIslands.length < level.islands.length) {
      stranders = aI1N + aI2N;
    }
    removeBridge(level, island, aI1, aI1N);
    removeBridge(level, island, aI2, aI2N);

    const aI2N2 = possibleConnections(level, island, aI2);
    let aI1N2 = 2;
    if (!stranders && aI2N2 !== aI2N) {
      addBridge(level, island, aI2, aI2N2);
      aI1N2 = possibleConnections(level, island, aI1);
      addBridge(level, island, aI1, aI1N2);
      const connectedIslands = getPossiblyConnectedIslands(level, island);
      if (connectedIslands.length < level.islands.length) {
        stranders = aI1N2 + aI2N2;
      }
      removeBridge(level, island, aI1, aI1N2);
      removeBridge(level, island, aI2, aI2N2);
    }
    if (stranders) {
      // there are three situations here
      // 1. bridgesLeft - (max bridges to stranding islands) is equal to all bridges in the non-stranding islands, so we just fill them up
      // 2. bridgesLeft - (max bridges to stranding islands) is greater than non-stranding islands possible choices (aka 1 for 1 non-stranding island or 3 for 2 non-stranding islands)
      // 3. ADVANCED ONLY - bridgesLeft - (max bridges to stranding islands) is 2 and there is one non-stranding island with only 1 possible connection, then a bridge is pigeonholed onto the other island
      //    Separated the advanced one because it is more complicated
      const nonStrandingIslands = adjacentIslands.filter(
        (aI) =>
          !(
            (aI.x === aI1.x && aI.y === aI1.y) ||
            (aI.x === aI2.x && aI.y === aI2.y)
          )
      );
      const possibleBridges = nonStrandingIslands.reduce(
        (s, aI) => s + possibleConnections(level, island, aI),
        0
      );
      const maxStrandingBridges = stranders - 1;
      // 1
      if (bridgesLeft(island) - maxStrandingBridges === possibleBridges) {
        nonStrandingIslands.forEach((nBI) => {
          addBridge(
            level,
            island,
            nBI,
            possibleConnections(level, island, nBI)
          );
          found = true;
        });
      } else if (
        bridgesLeft(island) - maxStrandingBridges >
        (adjacentIslands.length - 3) * 2
      ) {
        // 2
        nonStrandingIslands.forEach((aI) => {
          addBridge(level, island, aI, 1);
          found = true;
        });
      } else if (
        advanced &&
        bridgesLeft(island) - maxStrandingBridges === 2 &&
        nonStrandingIslands.find(
          (nBI) => possibleConnections(level, island, nBI) === 1
        )
      ) {
        // 3
        const pigeonholed = nonStrandingIslands.find(
          (nBI) => possibleConnections(level, island, nBI) === 2
        );
        if (pigeonholed) {
          addBridge(level, island, pigeonholed, 1);
          found = true;
        }
      }
      if (found) {
        return false;
      }
    }
  });
  return found;
};

const noBlockedPairsHelper = (level, island, disconnectedIslands) => {
  let unblockingPair = null;
  const pairs = islandPairs(disconnectedIslands);
  let twoUnblockingPairs = false;
  forEach(pairs, ([aI1, aI2]) => {
    addBridge(level, island, aI1);
    addBridge(level, island, aI2);
    let strandedBoat = false;
    forEach(level.boats, ({ boat, dock }) => {
      const connected = connectedByWater(level, boat, dock);
      if (!connected) {
        strandedBoat = true;
        return false;
      }
    });
    removeBridge(level, island, aI1);
    removeBridge(level, island, aI2);
    if (!strandedBoat) {
      if (!unblockingPair) {
        unblockingPair = [aI1, aI2];
      } else {
        twoUnblockingPairs = true;
        return false;
      }
    }
  });
  if (twoUnblockingPairs || !unblockingPair) {
    return false;
  } else {
    let changed = false;
    const blockingIslands = disconnectedIslands.filter(
      (aI) =>
        !(
          (aI.x === unblockingPair[0].x && aI.y === unblockingPair[0].y) ||
          (aI.x === unblockingPair[1].x && aI.y === unblockingPair[1].y)
        )
    );
    blockingIslands.forEach((bI) => {
      changed = changed || addMaxBridge(level, island, bI, 0);
    });
    return changed;
  }
};

const noBlockedTriplesHelper = (level, island, disconnectedIslands) => {
  let unblockingTriple = null;
  const triples = islandTriples(disconnectedIslands);
  let twoUnblockingTriples = false;
  forEach(triples, ([aI1, aI2, aI3]) => {
    addBridge(level, island, aI1);
    addBridge(level, island, aI2);
    addBridge(level, island, aI3);
    let strandedBoat = false;
    forEach(level.boats, ({ boat, dock }) => {
      const connected = connectedByWater(level, boat, dock);
      if (!connected) {
        strandedBoat = true;
        return false;
      }
    });
    removeBridge(level, island, aI1);
    removeBridge(level, island, aI2);
    removeBridge(level, island, aI3);
    if (!strandedBoat) {
      if (!unblockingTriple) {
        unblockingTriple = [aI1, aI2, aI3];
      } else {
        twoUnblockingTriples = true;
        return false;
      }
    }
  });
  if (twoUnblockingTriples || !unblockingTriple) {
    return false;
  } else {
    let changed = false;
    const blockingIslands = disconnectedIslands.filter(
      (aI) =>
        !(
          (aI.x === unblockingTriple[0].x && aI.y === unblockingTriple[0].y) ||
          (aI.x === unblockingTriple[1].x && aI.y === unblockingTriple[1].y) ||
          (aI.x === unblockingTriple[2].x && aI.y === unblockingTriple[2].y)
        )
    );
    blockingIslands.forEach((bI) => {
      changed = changed || addMaxBridge(level, island, bI, 0);
    });
    return changed;
  }
};

// Only choices no blocked boats heuristic
//     A     X     A
//     |  b     d  |
//     ? --- B ----?  X must connect to at least two islands so the we know it cannot connect to B or it will block in the dock or block in the boat
const onlyChoicesNoBlockedBoatsHeuristic = (level, island, islandData) => {
  if (!level.boats || !island.b) {
    return false;
  }
  const { adjacentIslands } = islandData;
  const [connectedIslands, disconnectedIslands] = partition(
    adjacentIslands,
    (aI) => bridgeBetween(level, island, aI)
  );
  const mustUseBridges =
    island.b -
    connectedIslands.reduce(
      (sum, cI) => sum + possibleConnections(level, island, cI),
      0
    );
  let found = false;
  if (mustUseBridges > 4) {
    found = noBlockedTriplesHelper(level, island, disconnectedIslands);
  } else if (mustUseBridges > 2) {
    found = noBlockedPairsHelper(level, island, disconnectedIslands);
  }
  return found;
};

// This is for a situation where multiple bridges together would block a boat which pigeonholes bridges onto all the islands that are not one of those
// Z   X   Y  X cannot connect to both Ys because it blocks the boat, so it MUST connect to Z
//       b |
//     Y - ?
const noBlockedBoatsPigeonholeHeuristic = (advanced) => (
  level,
  island,
  islandData
) => {
  if (!level.boats || !island.b) {
    return false;
  }
  const { adjacentIslands } = islandData;
  const disconnectedIslands = adjacentIslands.filter(
    (aI) => !bridgeBetween(level, island, aI)
  );
  let found = false;
  const pairs = islandPairs(disconnectedIslands);
  forEach(pairs, ([aI1, aI2]) => {
    addBridge(level, island, aI1);
    addBridge(level, island, aI2);
    let strandedBoat = false;
    forEach(level.boats, ({ boat, dock }) => {
      const connected = connectedByWater(level, boat, dock);
      if (!connected) {
        strandedBoat = true;
        return false;
      }
    });
    removeBridge(level, island, aI1);
    removeBridge(level, island, aI2);
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
          addBridge(
            level,
            island,
            nBI,
            possibleConnections(level, island, nBI)
          );
          found = true;
        });
      } else if (
        bridgesLeft(island) - maxBlockingBridges >
        (adjacentIslands.length - 3) * 2
      ) {
        // 2
        nonBlockingIslands.forEach((aI) => {
          addBridge(level, island, aI, 1);
          found = true;
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
          addBridge(level, island, pigeonholed, 1);
          found = true;
        }
      }
      if (found) {
        return false;
      }
    }
  });
  return found;
};

const evenOrOddQuestion = (level, island, islandData) => {
  if (island.b) {
    return false;
  }

  const totalBridges = level.islands.reduce((sum, i) => {
    if (i.b) {
      return sum + i.b;
    } else if (
      getAdjacentIslands(level, i).length === 0 ||
      (i.x === island.x && i.y === island.y)
    ) {
      return sum;
    } else {
      return -100000;
    }
  }, 0);
  if (totalBridges < 0) {
    return false;
  }
  const { adjacentIslands } = islandData;
  const connectedBridgesCount = getTotalConnectedBridges(level, island);
  if (
    adjacentIslands.length === 1 &&
    (totalBridges - connectedBridgesCount) % 2 === 1
  ) {
    addBridge(level, island, adjacentIslands[0]);
    return true;
  }
  return false;
};

// TODO we could do some narrow guess heuristics.
// They aren't great puzzle solving so I am deciding whether to bother.
// Basically, if a a stranded island has two choices where to connect, you can guess and check one of those.
// There may be other variations with other mechanics e.g. boats

// guess each bridge and see if it is solveable with them
const guessAndCheck = (nested) => (level, island) => {
  let adjacentIslands = [];
  // for efficiency we only check islands to the bottom or right of us so as to not double our efforts uselessly
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0 &&
      (level.islands[i].x > island.x || level.islands[i].y > island.y)
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
      if (validated(levelClone)) {
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
  moreBridgesThanChoicesHeuristic, // 3 (swapped with 4)
  noStrandedIslandsSimpleHeuristic, // 4 (swapped with 3)
  noBlockedBoatsHeuristic, // 5
  pigeonholeHeuristic, // 6
  noPiratedBoatsHeuristic, // 7
  noPiratedBoatsPreventBridgeHeuristic, // 8
  noStrandedIslandsAdvanced1Heuristic, // 9
  noStrandedIslandsAdvanced2Heuristic, // 10
  onlyChoicesNoBlockedBoatsHeuristic, // 11
  noStrandedIslandsAdvanced3Heuristic(false), // 12
  noStrandedIslandsAdvanced3Heuristic(true), // 13
  unfillableIslandPigeonholeHeuristic(false), // 14
  unfillableIslandPigeonholeHeuristic(true), // 15
  noBlockedBoatsPigeonholeHeuristic(false), // 16
  noBlockedBoatsPigeonholeHeuristic(true), // 17
  evenOrOddQuestion, // 18
  guessAndCheck(false), // 19
  guessAndCheck(true), // 20
];

const getIslandData = (level, island, levelData, recalc) => {
  if (!recalc && levelData[`${island.x}_${island.y}`]) {
    return levelData[`${island.x}_${island.y}`];
  } else {
    const adjacentIslands = getAdjacentIslands(level, island);
    const islandData = { adjacentIslands };
    levelData[`${island.x}_${island.y}`] = islandData;
    return islandData;
  }
};

const solve = (
  level,
  quiet = false,
  noGuessing = false,
  noNestedGuessing = false
) => {
  // quiet || console.log('Unsolved:');
  // quiet || print(level);
  let solutionData = {
    loops: 0,
    heuristicsApplied: [],
  };
  const levelData = {};
  while (!solved(level)) {
    solutionData.loops++;
    let somethingChanged = false;
    const heurLen =
      heuristics.length - (noGuessing ? 2 : noNestedGuessing ? 1 : 0);
    const clonedLevel = cloneDeep(level);
    // Probably in the future we will need to have heuristics check more than just one island at a time, but for now this works
    for (let h = 0; h < heurLen; h++) {
      forEach(level.islands, (island) => {
        let islandData = getIslandData(level, island, levelData, h === 0);
        levelData[`${island.x}_${island.y}`] = islandData;
        if (!full(island)) {
          const heuristicWorked = heuristics[h](
            level,
            island,
            islandData,
            levelData
          );
          if (heuristicWorked) {
            // quiet || console.log(h);
            // quiet || print(level);
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
  let complexity = 0;
  solutionData.maxHeuristic = 0;
  for (let i = 0; i < solutionData.heuristicsApplied.length; i++) {
    complexity += Math.log2(solutionData.heuristicsApplied[i] + 2) - 1;
    // I call this "thrashing" and I think more accurately represents complexity than just the index of the heuristic
    if (
      i > 0 &&
      solutionData.heuristicsApplied[i] < solutionData.heuristicsApplied[i - 1]
    ) {
      complexity += Math.log2(solutionData.heuristicsApplied[i] + 2) - 1;
    }

    solutionData.maxHeuristic = Math.max(
      solutionData.maxHeuristic,
      solutionData.heuristicsApplied[i]
    );
  }
  solutionData.complexity =
    (complexity / solutionData.heuristicsApplied.length) * 30 +
    solutionData.maxHeuristic * 2 +
    level.islands.length / 2;
  quiet ||
    console.log(
      `Solved (${solutionData.loops} loops; heuristics: ${
        solutionData.heuristicsApplied
      }, complexity: ${solutionData.complexity.toFixed(0)}):`
    );
  quiet || print(level);
  if (!validated(level)) {
    quiet || console.log('Solution is invalid!!!');
    throw new Error('Invalid final solution');
  }
  return solutionData;
};

module.exports = solve;

solve.heuristics = heuristics;

solve.hasMultipleSolutions = (
  level,
  quiet = false,
  noGuessing = false,
  noNestedGuessing = false
) => {
  const solvedLevel = cloneDeep(level);
  solve(solvedLevel, true, noGuessing, noNestedGuessing);
  let found = false;
  forEach(level.islands, (island, i) => {
    let adjacentIslands = [];
    for (let j = i + 1; j < level.islands.length; j++) {
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
        solve(level, true, noGuessing, noNestedGuessing);
        if (validated(level)) {
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
