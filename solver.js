const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const print = require('./print');

const { levels } = yaml.safeLoad(
  fs.readFileSync(path.join(__dirname, 'levels.yml'))
);

/**
 * This solver attempts to not just solve a level but also determine how difficult a level is by solving using
 * various heuristics that a human being would use to solve a level.
 */

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

// if there is only one island that can connect, connect to that island
const onlyChoiceHueristic = (level, island) => {
  let adjacentIsland = null;
  for (let i = 0; i < level.islands.length; i++) {
    if (adjacent(level, island, level.islands[i]) && !full(level.islands[i])) {
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
// TODO: onlyChoices heuristic

// if there are so many bridges required that you MUST have 1 point to each adjacent island
const moreBridgesThanChoicesHueristic = (level, island) => {
  let adjacentIslands = [];
  for (let i = 0; i < level.islands.length; i++) {
    if (adjacent(level, island, level.islands[i]) && !full(level.islands[i])) {
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

const solved = (level) =>
  level.islands.reduce((s, island) => s && island.b === island.n, true);

const heuristics = [onlyChoiceHueristic, moreBridgesThanChoicesHueristic];

const solve = (level) => {
  console.log('Unsolved:');
  print(level);
  let solutionData = {
    loops: 0,
    heuristicsApplied: [],
  };
  while (!solved(level)) {
    solutionData.loops++;
    let somethingChanged = false;
    // Probably in the future we will need to have hueristics check more than just one island at a time, but for now this works
    for (let h = 0; h < heuristics.length; h++) {
      level.islands.forEach((island) => {
        if (!full(island)) {
          const heuristicWorked = heuristics[h](level, island);
          if (heuristicWorked) {
            solutionData.heuristicsApplied.push(h);
            // console.log(h);
            // print(level);
          }
          somethingChanged = somethingChanged || heuristicWorked;
        }
      });
      // We want to keep repeating with the easiest heuristics until there is "no choice" but to use the more complex ones
      if (somethingChanged) break;
    }
    if (!somethingChanged) {
      console.log(`Level thus far (${solutionData.loops} loops):`);
      console.log(adjacent(level, level.islands[1], level.islands[4]));
      print(level);
      throw new Error('Level unsolvable with current set of heuristics');
    }
  }
  console.log(
    `Solved (${solutionData.loops} loops; heuristics: ${solutionData.heuristicsApplied}):`
  );
  print(level);
};

levels.forEach((level) => solve(level));
