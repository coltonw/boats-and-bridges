const { forEach, cloneDeep, clone } = require('lodash');

const bridgesLeft = (island) => (island.b || 8) - island.n;

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
    let maxBridgeVMax = 2;
    if (level.maxBridgesV) {
      forEach(level.maxBridgesV, (maxBridgeV) => {
        if (
          maxBridgeV.x === island0.x &&
          maxBridgeV.y0 === Math.min(island0.y, island1.y) &&
          maxBridgeV.y1 === Math.max(island0.y, island1.y)
        ) {
          maxMax = Math.min(maxMax, maxBridgeV.max);
          maxBridgeVMax = maxBridgeV.max;
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
        maxMax = Math.min(maxMax, maxBridgeVMax - bridgeV.n);
        return false;
      }
    });
  }
  if (island0.y === island1.y) {
    let maxBridgeHMax = 2;
    if (level.maxBridgesH) {
      forEach(level.maxBridgesH, (maxBridgeH) => {
        if (
          maxBridgeH.y === island0.y &&
          maxBridgeH.x0 === Math.min(island0.x, island1.x) &&
          maxBridgeH.x1 === Math.max(island0.x, island1.x)
        ) {
          maxMax = Math.min(maxMax, maxBridgeH.max);
          maxBridgeHMax = maxBridgeH.max;
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
        maxMax = Math.min(maxMax, maxBridgeHMax - bridgeH.n);
        return false;
      }
    });
  }
  return Math.min(bridgesLeft(island0), bridgesLeft(island1), maxMax);
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
        ((level.bridgesH[i].y <= island0.y &&
          level.bridgesH[i].y >= island1.y) ||
          (level.bridgesH[i].y >= island0.y &&
            level.bridgesH[i].y <= island1.y)) &&
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
        ((level.bridgesV[i].x <= island0.x &&
          level.bridgesV[i].x >= island1.x) ||
          (level.bridgesV[i].x >= island0.x &&
            level.bridgesV[i].x <= island1.x)) &&
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

const full = (island) => bridgesLeft(island) <= 0;

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

const removeBridge = (level, island0, island1, n = 1) => {
  if (island0.x === island1.x) {
    const bridge = {
      x: island0.x,
      y0: Math.min(island0.y, island1.y),
      y1: Math.max(island0.y, island1.y),
    };
    for (let i = 0; i < level.bridgesV.length; i++) {
      if (
        level.bridgesV[i].x === bridge.x &&
        level.bridgesV[i].y0 === bridge.y0 &&
        level.bridgesV[i].y1 === bridge.y1
      ) {
        level.bridgesV[i].n -= n;
        if (level.bridgesV[i].n <= 0) {
          level.bridgesV.splice(i, 1);
        }
        break;
      }
    }
  } else {
    const bridge = {
      x0: Math.min(island0.x, island1.x),
      x1: Math.max(island0.x, island1.x),
      y: island0.y,
    };
    for (let i = 0; i < level.bridgesH.length; i++) {
      if (
        level.bridgesH[i].x0 === bridge.x0 &&
        level.bridgesH[i].x1 === bridge.x1 &&
        level.bridgesH[i].y === bridge.y
      ) {
        level.bridgesH[i].n -= n;
        if (level.bridgesH[i].n <= 0) {
          level.bridgesH.splice(i, 1);
        }
        break;
      }
    }
  }
  island0.n -= n;
  island1.n -= n;
};

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

const getConnectedIslands = (level, startingIsland) => {
  const traversingStack = [startingIsland];
  const visited = [startingIsland];

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
  return visited;
};

const doubleConnectedAdjacentIslands = (level, island) => {
  const result = [];
  level.islands.forEach((i) => {
    if (
      adjacent(level, i, island) &&
      (bridgeBetween(level, i, island) || { n: 0 }).n > 1
    ) {
      result.push(i);
    }
  });
  return result;
};

const doubleConnected = (level, island1, island2) => {
  const traversingStack = [island1];
  const visited = [island1];

  let isConnected = false;
  while (traversingStack.length > 0) {
    const island = traversingStack.pop();
    const connected = doubleConnectedAdjacentIslands(level, island);
    forEach(connected, (cI) => {
      if (cI.x === island2.x && cI.y === island2.y) {
        isConnected = true;
        return false;
      }
      if (!visited.find((i) => i.x === cI.x && i.y === cI.y)) {
        visited.push(cI);
        if (!cI.b || cI.b > 3) {
          traversingStack.unshift(cI);
        }
      }
    });
  }
  return isConnected;
};

const fullyConnected = (level) => {
  const connectedIslands = getConnectedIslands(level, level.islands[0]);
  return connectedIslands.length === level.islands.length;
};

const allBoatsDocked = (level) => {
  if (level.boats) {
    let blockedBoat = false;
    forEach(level.boats, ({ boat, dock }) => {
      if (!connectedByWater(level, boat, dock)) {
        blockedBoat = true;
        return false;
      }
    });
    return !blockedBoat;
  }
  return true;
};

const allTrucksGaraged = (level) => {
  if (level.trucks) {
    let stuckTruck = false;
    forEach(level.trucks, ({ truck, garage }) => {
      if (!doubleConnected(level, truck, garage)) {
        stuckTruck = true;
        return false;
      }
    });
    return !stuckTruck;
  }
  return true;
};

const noBoatPirated = (level) => {
  if (level.boats && level.pirates) {
    let piratedBoat = false;
    forEach(level.pirates, (pirate) => {
      const piratedWaters = getMustConnectWater(level, pirate, []);
      forEach(level.boats, ({ boat }) => {
        if (piratedWaters.find((w) => w.x === boat.x && w.y === boat.y)) {
          piratedBoat = true;
          return false;
        }
      });
    });
    return !piratedBoat;
  }
  return true;
};

const validated = (level) => {
  return (
    fullyConnected(level) &&
    allBoatsDocked(level) &&
    allTrucksGaraged(level) &&
    noBoatPirated(level)
  );
};

// water coordinates are to the bottom right of island coordinates
// e.g. water 0 0 will be in between island 0 0 and island 1 1
const connectedWater = (level, water) => {
  const result = [];
  let up = true;
  let down = true;
  let left = true;
  let right = true;
  level.bridgesH.forEach((bridgeH) => {
    if (bridgeH.x0 <= water.x && bridgeH.x1 > water.x) {
      if (bridgeH.y === water.y) {
        up = false;
      }
      if (bridgeH.y === water.y + 1) {
        down = false;
      }
    }
  });
  level.bridgesV.forEach((bridgeV) => {
    if (bridgeV.y0 <= water.y && bridgeV.y1 > water.y) {
      if (bridgeV.x === water.x) {
        left = false;
      }
      if (bridgeV.x === water.x + 1) {
        right = false;
      }
    }
  });

  // min x and y is -1 max x and y is max island x and y respectively
  if (water.x <= -1) {
    left = false;
  }
  if (water.y <= -1) {
    up = false;
  }
  let maxX = 0;
  let maxY = 0;
  level.islands.forEach((island) => {
    maxX = Math.max(maxX, island.x);
    maxY = Math.max(maxY, island.y);
  });
  if (water.x >= maxX) {
    right = false;
  }
  if (water.y >= maxY) {
    down = false;
  }

  if (up) {
    result.push({ x: water.x, y: water.y - 1 });
  }
  if (down) {
    result.push({ x: water.x, y: water.y + 1 });
  }
  if (left) {
    result.push({ x: water.x - 1, y: water.y });
  }
  if (right) {
    result.push({ x: water.x + 1, y: water.y });
  }
  return result;
};

const connectedByWater = (level, boat, dock) => {
  if (!boat || !dock || (dock.x === boat.x && dock.y === boat.y)) {
    return true;
  }
  const traversingStack = [boat];
  const visited = [boat];

  while (traversingStack.length > 0) {
    const water = traversingStack.pop();
    const connected = connectedWater(level, water);
    let found = false;
    forEach(connected, (cW) => {
      if (!visited.find((w) => w.x === cW.x && w.y === cW.y)) {
        visited.push(cW);
        traversingStack.unshift(cW);
        if (dock.x === cW.x && dock.y === cW.y) {
          found = true;
          return false;
        }
      }
    });
    if (found) {
      return true;
    }
  }
  return false;
};

// water coordinates are to the bottom right of island coordinates
// e.g. water 0 0 will be in between island 0 0 and island 1 1
const mustConnectWater = (level, water, maxX, maxY, bridgesToExclude = []) => {
  const result = [];
  let up = true;
  let down = true;
  let left = true;
  let right = true;
  const checkBridgeH = (bridgeH) => {
    if (
      bridgesToExclude.find(
        (b) =>
          typeof b.x0 === 'number' &&
          bridgeH.x0 === b.x0 &&
          bridgeH.x1 === b.x1 &&
          bridgeH.y === b.y
      )
    ) {
      return;
    }
    if (bridgeH.x0 <= water.x && bridgeH.x1 > water.x) {
      if (bridgeH.y === water.y) {
        up = false;
      }
      if (bridgeH.y === water.y + 1) {
        down = false;
      }
    }
  };
  level.bridgesH.forEach(checkBridgeH);
  const checkBridgeV = (bridgeV) => {
    if (
      bridgesToExclude.find(
        (b) =>
          typeof b.x === 'number' &&
          bridgeV.x === b.x &&
          bridgeV.y0 === b.y0 &&
          bridgeV.y1 === b.y1
      )
    ) {
      return;
    }
    if (bridgeV.y0 <= water.y && bridgeV.y1 > water.y) {
      if (bridgeV.x === water.x) {
        left = false;
      }
      if (bridgeV.x === water.x + 1) {
        right = false;
      }
    }
  };
  level.bridgesV.forEach(checkBridgeV);
  for (let i = 0; i < level.islands.length - 1; i++) {
    for (let j = i + 1; j < level.islands.length; j++) {
      if (
        vertAdjacent(level, level.islands[i], level.islands[j]) &&
        possibleConnections(level, level.islands[i], level.islands[j]) > 0 &&
        level.islands[i].b !== 1 &&
        level.islands[j].b !== 1
      ) {
        checkBridgeV({
          x: level.islands[i].x,
          y0: Math.min(level.islands[i].y, level.islands[j].y),
          y1: Math.max(level.islands[i].y, level.islands[j].y),
        });
      } else if (
        horAdjacent(level, level.islands[i], level.islands[j]) &&
        possibleConnections(level, level.islands[i], level.islands[j]) > 0 &&
        level.islands[i].b !== 1 &&
        level.islands[j].b !== 1
      ) {
        checkBridgeH({
          x0: Math.min(level.islands[i].x, level.islands[j].x),
          x1: Math.max(level.islands[i].x, level.islands[j].x),
          y: level.islands[i].y,
        });
      }
    }
  }

  // min x and y is -1 max x and y is max island x and y respectively
  if (water.x <= -1) {
    left = false;
  }
  if (water.y <= -1) {
    up = false;
  }
  if (water.x >= maxX) {
    right = false;
  }
  if (water.y >= maxY) {
    down = false;
  }

  if (up) {
    result.push({ x: water.x, y: water.y - 1 });
  }
  if (down) {
    result.push({ x: water.x, y: water.y + 1 });
  }
  if (left) {
    result.push({ x: water.x - 1, y: water.y });
  }
  if (right) {
    result.push({ x: water.x + 1, y: water.y });
  }
  return result;
};

const getMustConnectWater = (level, pirate, bridgesToExclude) => {
  const traversingStack = [pirate];
  const visited = [pirate];
  let maxX = 0;
  let maxY = 0;
  level.islands.forEach((island) => {
    maxX = Math.max(maxX, island.x);
    maxY = Math.max(maxY, island.y);
  });

  while (traversingStack.length > 0) {
    const water = traversingStack.pop();
    const connected = mustConnectWater(
      level,
      water,
      maxX,
      maxY,
      bridgesToExclude
    );
    forEach(connected, (cW) => {
      if (!visited.find((w) => w.x === cW.x && w.y === cW.y)) {
        visited.push(cW);
        traversingStack.unshift(cW);
      }
    });
  }
  return visited;
};

const connectedOutside = (level, startingWater, bridgesToExclude = []) => {
  const traversingStack = [startingWater];
  const visited = [startingWater];
  let maxX = 0;
  let maxY = 0;
  level.islands.forEach((island) => {
    maxX = Math.max(maxX, island.x);
    maxY = Math.max(maxY, island.y);
  });

  let outside = false;
  while (traversingStack.length > 0) {
    const water = traversingStack.pop();
    const connected = mustConnectWater(
      level,
      water,
      maxX,
      maxY,
      bridgesToExclude
    );
    forEach(connected, (cW) => {
      if (cW.x <= -1 || cW.y <= -1 || cW.x >= maxX || cW.y >= maxY) {
        outside = true;
        return false;
      }
      if (!visited.find((w) => w.x === cW.x && w.y === cW.y)) {
        visited.push(cW);
        traversingStack.unshift(cW);
      }
    });
  }
  return outside;
};

const allBridgePossibilities = (level, island, adjacentIslands) => {
  const bLeft = bridgesLeft(island);
  const islands = [];
  let possibilities = [];
  forEach(adjacentIslands, (aI, i) => {
    islands.push(aI);
    if (possibleConnections(level, island, aI) > 1) {
      islands.push(aI);
    }
    if (adjacentIslands.length - i + 1 < bLeft) {
      return false;
    }
    possibilities.push([aI]);
  });

  let count = 1;
  while (count < bLeft) {
    const prevPossibilities = possibilities;
    possibilities = [];
    prevPossibilities.forEach((poss) => {
      forEach(islands, (is, i) => {
        if (islands.length - i + 1 < bLeft - count) {
          return false;
        }
        if (
          i > islands.indexOf(poss[poss.length - 1]) &&
          poss[poss.length - 1] !== poss[poss.length - 2]
        ) {
          const newPoss = poss.slice();
          newPoss.push(is);
          possibilities.push(newPoss);
        }
      });
    });
    count += 1;
  }

  return possibilities;
};

const clear = (level) => {
  level.islands.forEach((i) => {
    i.n = 0;
  });
  level.bridgesH = [];
  level.bridgesV = [];
  delete level.maxBridgesH;
  delete level.maxBridgesV;
  delete level.boatConnectedOutside;
  delete level.pirateConnectedOutside;
};

const possiblyConnectedIslands = (level, island, exclude = []) => {
  const result = [];
  level.islands.forEach((i) => {
    if (exclude.find((e) => i.x === e.x && i.y === e.y)) {
      return true;
    }
    if (
      adjacent(level, i, island) &&
      (possibleConnections(level, i, island) > 0 ||
        bridgeBetween(level, i, island))
    ) {
      result.push(i);
    }
  });
  return result;
};

const getPossiblyConnectedIslands = (level, startingIsland, exclude = []) => {
  const traversingStack = [startingIsland];
  const visited = [startingIsland];

  while (traversingStack.length > 0) {
    const island = traversingStack.pop();
    const connected = possiblyConnectedIslands(level, island, exclude);
    // we only want to exclude an island on the first pass. It is fine to connect to from another angle.
    exclude = [];
    connected.forEach((cI) => {
      if (!visited.find((i) => i.x === cI.x && i.y === cI.y)) {
        visited.push(cI);
        if (!cI.b || cI.b > 1) {
          traversingStack.unshift(cI);
        }
      }
    });
  }
  return visited;
};

const possiblyDoubleConnectedAdjacentIslands = (
  level,
  island,
  excludeBridges = []
) => {
  const result = [];
  level.islands.forEach((i) => {
    if (
      excludeBridges.find((b) =>
        i.x === island.x
          ? b.x === i.x &&
            b.y0 === Math.min(i.y, island.y) &&
            b.y1 === Math.max(i.y, island.y)
          : b.x0 === Math.min(i.x, island.x) &&
            b.x1 === Math.max(i.x, island.x) &&
            b.y === i.y
      )
    ) {
      return;
    }
    if (
      adjacent(level, i, island) &&
      possibleConnections(level, i, island) +
        (bridgeBetween(level, i, island) || { n: 0 }).n >
        1
    ) {
      result.push(i);
    }
  });
  return result;
};

const getPossiblyDoubleConnectedIslands = (
  level,
  startingIsland,
  excludeBridges = []
) => {
  const traversingStack = [startingIsland];
  let visited = [startingIsland];

  while (traversingStack.length > 0) {
    const island = traversingStack.pop();
    const connIslands = possiblyDoubleConnectedAdjacentIslands(
      level,
      island,
      excludeBridges
    );
    connIslands.forEach((cI) => {
      if (!visited.find((i) => i.x === cI.x && i.y === cI.y)) {
        visited.push(cI);
        if (!cI.b || cI.b > 3) {
          traversingStack.unshift(cI);
        }
      }
    });
  }
  return visited;
};

const possiblyDoubleConnectedAdjacentIslandsAdvanced = (
  level,
  island,
  excludeBridges = []
) => {
  const passThroughs = [];
  const singles = [];
  const deadEnds = [];
  level.islands.forEach((i) => {
    if (
      excludeBridges.find((b) =>
        i.x === island.x
          ? b.x === i.x &&
            b.y0 === Math.min(i.y, island.y) &&
            b.y1 === Math.max(i.y, island.y)
          : b.x0 === Math.min(i.x, island.x) &&
            b.x1 === Math.max(i.x, island.x) &&
            b.y === i.y
      )
    ) {
      return;
    }
    if (
      adjacent(level, i, island) &&
      possibleConnections(level, i, island) +
        (bridgeBetween(level, i, island) || { n: 0 }).n >
        1
    ) {
      if (i.b && i.b < 4) {
        deadEnds.push(i);
      } else {
        const connIslands = connectedIslands(level, i);
        const numConnected = connIslands.find(
          (cI) => cI.x === island.x && cI.y === island.y
        )
          ? connIslands.length
          : connIslands.length + 1;
        if (i.b && i.b < numConnected + 2) {
          deadEnds.push(i);
        } else if (i.b && i.b === numConnected + 2) {
          singles.push(i);
        } else {
          passThroughs.push(i);
        }
      }
    }
  });
  return [passThroughs, singles, deadEnds];
};

const getPossiblyDoubleConnectedIslandsAdvanced = (
  level,
  startingIsland,
  excludeBridges = []
) => {
  const traversingStack = [startingIsland];
  const traversingSingles = [];
  let visited = [startingIsland];

  while (traversingStack.length > 0 || traversingSingles.length > 0) {
    if (traversingStack.length > 0) {
      const island = traversingStack.pop();
      const [passThroughs, singles, deadEnds] =
        possiblyDoubleConnectedAdjacentIslandsAdvanced(
          level,
          island,
          excludeBridges
        );
      passThroughs.forEach((cI) => {
        if (!visited.find((i) => i.x === cI.x && i.y === cI.y)) {
          visited.push(cI);
          traversingStack.unshift(cI);
        }
      });
      singles.forEach((cI) => {
        if (!visited.find((i) => i.x === cI.x && i.y === cI.y)) {
          visited.push(cI);
          traversingSingles.unshift(cI);
        }
      });
      deadEnds.forEach((cI) => {
        if (!visited.find((i) => i.x === cI.x && i.y === cI.y)) {
          visited.push(cI);
        }
      });
    } else {
      const island = traversingSingles.pop();
      const [passThroughs, singles, deadEnds] =
        possiblyDoubleConnectedAdjacentIslandsAdvanced(
          level,
          island,
          excludeBridges
        );
      passThroughs.forEach((cI) => {
        if (
          !visited.find((i) => i.x === cI.x && i.y === cI.y) &&
          bridgeBetween(level, island, cI)
        ) {
          visited.push(cI);
          traversingStack.unshift(cI);
        }
      });
      singles.forEach((cI) => {
        if (
          !visited.find((i) => i.x === cI.x && i.y === cI.y) &&
          bridgeBetween(level, island, cI)
        ) {
          visited.push(cI);
          traversingSingles.unshift(cI);
        }
      });
      deadEnds.forEach((cI) => {
        if (
          !visited.find((i) => i.x === cI.x && i.y === cI.y) &&
          bridgeBetween(level, island, cI)
        ) {
          visited.push(cI);
        }
      });
    }
  }
  return visited;
};

const islandPairs = (islands, onlyOrthogonal = false) => {
  const pairs = [];
  for (let i = 0; i < islands.length - 1; i++) {
    for (let j = i + 1; j < islands.length; j++) {
      if (
        !onlyOrthogonal ||
        (islands[i].x !== islands[j].x && islands[i].y !== islands[j].y)
      ) {
        pairs.push([islands[i], islands[j]]);
      }
    }
  }
  return pairs;
};

const islandTriples = (islands) => {
  const triples = [];
  for (let i = 0; i < islands.length - 2; i++) {
    for (let j = i + 1; j < islands.length - 1; j++) {
      for (let k = j + 1; k < islands.length; k++) {
        triples.push([islands[i], islands[j], islands[k]]);
      }
    }
  }
  return triples;
};

const getAdjacentIslands = (level, island) => {
  let adjacentIslands = [];
  for (let i = 0; i < level.islands.length; i++) {
    if (
      adjacent(level, island, level.islands[i]) &&
      possibleConnections(level, island, level.islands[i]) > 0
    ) {
      adjacentIslands.push(level.islands[i]);
    }
  }
  return adjacentIslands;
};

const getTotalConnectedBridges = (level, island) => {
  let total = 0;
  level.bridgesH.forEach(({ x0, x1, y, n }) => {
    if ((island.x === x0 || island.x === x1) && island.y === y) {
      total += n;
    }
  });
  level.bridgesV.forEach(({ x, y0, y1, n }) => {
    if (island.x === x && (island.y === y0 || island.y === y1)) {
      total += n;
    }
  });

  return total;
};

/**
 * randomBiased takes a start and end integer and a ratio representing how much more likelie you want the start than the end and
 * then creates a range of probablilities for those numbers and each number in between such that the likelihood of being picked
 * drmas at a linear rate from the start to the end
 */
const randomBiased = (start, end, ratio = 3) => {
  // A / C = Ratio
  // A + B1 + B2 + ... + C = 1
  // A - B1 = B1 - B2 = B(N-2) - C = Step
  // NA - STEP*N(N-1)/2 = 1
  // A = 1/N + STEP*(N-1)/2
  // A - C = C(R - 1) = Step * (N - 1)
  // Step = C(R - 1)/(N - 1)
  // Step = 2(R - 1)/(N * (N - 1) * (R + 1))

  const diff = Math.abs(start - end);
  if (diff === 0) {
    return start;
  }
  const n = diff + 1;

  const inc = start < end ? 1 : -1;
  const step = (2 * (ratio - 1)) / (n * (n - 1) * (ratio + 1));
  const startProb = 1 / n + (step * (n - 1)) / 2;
  let cur = start;
  let curProb = startProb;
  let probCum = curProb;
  const rnd = Math.random();
  while (rnd > probCum) {
    curProb = curProb - step;
    probCum = probCum + curProb;
    cur = cur + inc;
  }
  return cur;
};

const compress = (level) => {
  const xCompress = [];
  const yCompress = [];

  const [xMaxIsl, yMaxIsl] = level.islands.reduce(
    ([mx, my], { x, y }) => [Math.max(mx, x), Math.max(my, y)],
    [0, 0]
  );
  const [xMaxB, yMaxB] = (level.boats || []).reduce(
    ([mx, my], { boat, dock }) => {
      const xMaxChoices = [mx];
      const yMaxChoices = [my];
      if (boat) {
        xMaxChoices.push(boat.x);
        yMaxChoices.push(boat.y);
      }
      if (dock) {
        xMaxChoices.push(dock.x);
        yMaxChoices.push(dock.y);
      }
      return [Math.max(...xMaxChoices), Math.max(...yMaxChoices)];
    },
    [xMaxIsl, yMaxIsl]
  );
  const [xMax, yMax] = (level.pirates || []).reduce(
    ([mx, my], { x, y }) => [Math.max(mx, x), Math.max(my, y)],
    [xMaxB, yMaxB]
  );

  let compress = 0;
  for (let i = 0; i <= xMax; i++) {
    const found = level.islands.find(({ x }) => x === i);
    if (!found) {
      compress += 1;
    }
    xCompress.push(compress);
  }
  compress = 0;
  for (let i = 0; i <= yMax; i++) {
    const found = level.islands.find(({ y }) => y === i);
    if (!found) {
      compress += 1;
    }
    yCompress.push(compress);
  }

  level.islands.forEach((island) => {
    island.x = island.x - xCompress[island.x];
    island.y = island.y - yCompress[island.y];
  });

  (level.trucks || []).forEach(({ truck, garage }) => {
    if (truck) {
      truck.x = truck.x - xCompress[truck.x];
      truck.y = truck.y - yCompress[truck.y];
    }
    if (garage) {
      garage.x = garage.x - xCompress[garage.x];
      garage.y = garage.y - yCompress[garage.y];
    }
  });

  (level.boats || []).forEach(({ boat, dock }) => {
    if (boat) {
      boat.x = boat.x - xCompress[boat.x];
      boat.y = boat.y - yCompress[boat.y];
    }
    if (dock) {
      dock.x = dock.x - xCompress[dock.x];
      dock.y = dock.y - yCompress[dock.y];
    }
  });

  (level.pirates || []).forEach((pirate) => {
    pirate.x = pirate.x - xCompress[pirate.x];
    pirate.y = pirate.y - yCompress[pirate.y];
  });

  (level.bridgesH || []).forEach((bridgeH) => {
    bridgeH.x0 = bridgeH.x0 - xCompress[bridgeH.x0];
    bridgeH.x1 = bridgeH.x1 - xCompress[bridgeH.x1];
    bridgeH.y = bridgeH.y - yCompress[bridgeH.y];
  });

  (level.bridgesV || []).forEach((bridgeV) => {
    bridgeV.x = bridgeV.x - xCompress[bridgeV.x];
    bridgeV.y0 = bridgeV.y0 - yCompress[bridgeV.y0];
    bridgeV.y1 = bridgeV.y1 - yCompress[bridgeV.y1];
  });
};

module.exports = {
  bridgesLeft,
  bridgeBetween,
  possibleConnections,
  vertAdjacent,
  horAdjacent,
  adjacent,
  full,
  addBridge,
  removeBridge,
  getConnectedIslands,
  fullyConnected,
  validated,
  allBridgePossibilities,
  clear,
  getPossiblyConnectedIslands,
  getPossiblyDoubleConnectedIslands,
  getPossiblyDoubleConnectedIslandsAdvanced,
  connectedByWater,
  getMustConnectWater,
  connectedOutside,
  islandPairs,
  islandTriples,
  getAdjacentIslands,
  getTotalConnectedBridges,
  randomBiased,
  compress,
};
