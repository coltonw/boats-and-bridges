const { forEach } = require('lodash');

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

const fullyConnected = (level) => {
  const connectedIslands = getConnectedIslands(level, level.islands[0]);
  return connectedIslands.length === level.islands.length;
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

const getConnectedWater = (level, startingWater) => {
  const traversingStack = [startingWater];
  const visited = [startingWater];

  while (traversingStack.length > 0) {
    const water = traversingStack.pop();
    const connected = connectedWater(level, water);
    connected.forEach((cW) => {
      if (!visited.find((w) => w.x === cW.x && w.y === cW.y)) {
        visited.push(cW);
        traversingStack.unshift(cW);
      }
    });
  }
  return visited;
};

const connectedByWater = (level, boat, dock) => {
  const connectedWater = getConnectedWater(level, boat);
  return !!connectedWater.find((w) => w.x === dock.x && w.y === dock.y);
};

const clear = (level) => {
  level.islands.forEach((i) => {
    i.n = 0;
  });
  level.bridgesH = [];
  level.bridgesV = [];
  delete level.maxBridgesH;
  delete level.maxBridgesV;
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
    connected.forEach((cI) => {
      if (!visited.find((i) => i.x === cI.x && i.y === cI.y)) {
        visited.push(cI);
        if (cI.b > 1) {
          traversingStack.unshift(cI);
        }
      }
    });
  }
  return visited;
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
  getConnectedIslands,
  fullyConnected,
  clear,
  getPossiblyConnectedIslands,
  getConnectedWater,
  connectedByWater,
};
