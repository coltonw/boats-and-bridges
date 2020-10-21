import solver from './solver.js';
import { clear } from './utils';
import yaml from 'js-yaml';

const levelElement = document.getElementById('level');

const scale = 15;

let storedLevel = null;
try {
  storedLevel = JSON.parse(localStorage.getItem('inProgressLevel'));
} catch (e) {}

const level = storedLevel || {
  islands: [],
  boats: [],
  bridgesH: [],
  bridgesV: [],
};

let timeouts = [];

const save = () => {
  clear(level);
  generateYaml();
  localStorage.setItem('inProgressLevel', JSON.stringify(level));
};

const generateYaml = () => {
  clear(level);
  level.islands.sort(
    ({ x: aX, y: aY }, { x: bX, y: bY }) => aY - bY + (aX - bX) / 10
  );
  const levelYaml = yaml.dump(level);
  const yamlEl = document.getElementById('yaml');
  yamlEl.value = levelYaml;
};

const run = (quiet = false) => {
  clear(level);
  let solution = null;
  try {
    solution = solver(level, quiet);
  } catch (e) {
    console.log(e);
  }
  if (solution) {
    timeouts.forEach((t) => clearTimeout(t));
    timeouts = [];
    timeouts.push(
      setTimeout(() => {
        clear(level);
        const multipleSolutions = solver.hasMultipleSolutions(level, true);
        if (multipleSolutions) {
          renderLevel();
          timeouts.push(setTimeout(() => run(true), 2000));
        } else if (
          solution.heuristicsApplied.indexOf(9) > -1 ||
          solution.heuristicsApplied.indexOf(10) > -1
        ) {
          clear(level);
          try {
            solver(level, true, true);
          } catch (e) {}
          renderLevel();
          timeouts.push(setTimeout(() => run(true), 2000));
        }
      }, 2000)
    );
  }

  renderLevel();
};

const renderLevel = () => {
  levelElement.innerHTML = '';

  level.islands.forEach(({ x, y, b }) => {
    const islandEl = document.createElement('div');
    islandEl.setAttribute('class', 'island');
    islandEl.setAttribute(
      'style',
      `left: ${(levelElement.offsetWidth / scale) * x}px; top: ${
        (levelElement.offsetHeight / scale) * y
      }px;`
    );
    islandEl.innerHTML = b || '?';

    levelElement.appendChild(islandEl);
  });

  level.bridgesH.forEach(({ x0, x1, y, n }) => {
    const bridgeEl = document.createElement('div');
    bridgeEl.setAttribute('class', `bridgeH ${n > 1 ? 'double' : ''}`);
    bridgeEl.setAttribute(
      'style',
      `left: ${(levelElement.offsetWidth / scale) * (x0 + 0.5) + 18}px; top: ${
        (levelElement.offsetHeight / scale) * y
      }px; width: ${
        (levelElement.offsetWidth / scale) * (x1 - x0 - 0.5) - 6
      }px;`
    );

    levelElement.appendChild(bridgeEl);
  });

  level.bridgesV.forEach(({ x, y0, y1, n }) => {
    const bridgeEl = document.createElement('div');
    bridgeEl.setAttribute('class', `bridgeV ${n > 1 ? 'double' : ''}`);
    bridgeEl.setAttribute(
      'style',
      `left: ${(levelElement.offsetWidth / scale) * x}px; top: ${
        (levelElement.offsetHeight / scale) * (y0 + 0.5) + 18
      }px; height: ${
        (levelElement.offsetHeight / scale) * (y1 - y0 - 0.5) - 6
      }px;`
    );

    levelElement.appendChild(bridgeEl);
  });

  level.boats.forEach(({ boat, dock }) => {
    if (boat) {
      const sailEl = document.createElement('div');
      sailEl.setAttribute('class', 'sail');
      sailEl.setAttribute(
        'style',
        `left: ${(levelElement.offsetWidth / scale) * (boat.x + 0.5)}px; top: ${
          (levelElement.offsetHeight / scale) * (boat.y + 0.5)
        }px;`
      );

      levelElement.appendChild(sailEl);

      const boatEl = document.createElement('div');
      boatEl.setAttribute('class', 'boat');
      boatEl.setAttribute(
        'style',
        `left: ${(levelElement.offsetWidth / scale) * (boat.x + 0.5)}px; top: ${
          (levelElement.offsetHeight / scale) * (boat.y + 0.5)
        }px;`
      );

      levelElement.appendChild(boatEl);
    }

    if (dock) {
      const dockEl = document.createElement('div');
      dockEl.setAttribute('class', 'dock');
      dockEl.setAttribute(
        'style',
        `left: ${(levelElement.offsetWidth / scale) * (dock.x + 0.5)}px; top: ${
          (levelElement.offsetHeight / scale) * (dock.y + 0.5)
        }px;`
      );
      levelElement.appendChild(dockEl);
    }
  });
};

const deleteIsland = ({ x, y }) => {
  for (let i = 0; i < level.islands.length; i++) {
    if (level.islands[i].x === x && level.islands[i].y === y) {
      level.islands.splice(i, 1);
      break;
    }
  }
};

levelElement.onclick = (ev) => {
  let offsetX = ev.offsetX;
  let offsetY = ev.offsetY;
  let el = ev.target;
  while (el.id !== 'level') {
    offsetX += el.offsetLeft;
    offsetY += el.offsetTop;
    el = el.parentNode;
  }
  const xScaled = (offsetX / levelElement.offsetWidth) * scale;
  const yScaled = (offsetY / levelElement.offsetHeight) * scale;
  if (
    Math.abs(0.5 - (xScaled % 1)) > 0.3 &&
    Math.abs(0.5 - (yScaled % 1)) > 0.3
  ) {
    // boat
    const x = Math.floor(xScaled - 0.5);
    const y = Math.floor(yScaled - 0.5);
    const boatInProgress = level.boats.find(({ boat, dock }) => !boat || !dock);
    if (boatInProgress) {
      if (!boatInProgress.boat) {
        boatInProgress.boat = { x, y };
      } else {
        boatInProgress.dock = { x, y };
      }
    } else {
      level.boats.push({ boat: { x, y }, dock: null });
    }
  } else {
    // island
    const x = Math.floor(xScaled);
    const y = Math.floor(yScaled);

    let island = level.islands.find(
      ({ x: foundX, y: foundY }) => foundX === x && foundY === y
    );
    if (island) {
      if (!island.b) {
        deleteIsland(island);
      } else if (island.b < 8) {
        island.b++;
      } else {
        island.b = null;
      }
    } else {
      level.islands.push({ x, y, b: 1, n: 0 });
    }
  }

  save();
  run();
};

levelElement.onauxclick = function (ev) {
  ev.preventDefault();
  let offsetX = ev.offsetX;
  let offsetY = ev.offsetY;
  let el = ev.target;
  while (el.id !== 'level') {
    offsetX += el.offsetLeft;
    offsetY += el.offsetTop;
    el = el.parentNode;
  }
  const xScaled = (offsetX / levelElement.offsetWidth) * scale;
  const yScaled = (offsetY / levelElement.offsetHeight) * scale;
  if (
    Math.abs(0.5 - (xScaled % 1)) > 0.3 &&
    Math.abs(0.5 - (yScaled % 1)) > 0.3
  ) {
    // boat
    const x = Math.floor(xScaled - 0.5);
    const y = Math.floor(yScaled - 0.5);
    const dockToDelete = level.boats.find(
      ({ dock }) => dock && dock.x === x && dock.y === y
    );
    const boatToDelete = level.boats.find(
      ({ boat }) => boat && boat.x === x && boat.y === y
    );
    if (dockToDelete) {
      if (!dockToDelete.boat) {
        dockToDelete.delete = true;
      } else {
        dockToDelete.dock = null;
      }
    } else if (boatToDelete) {
      if (!boatToDelete.dock) {
        boatToDelete.delete = true;
      } else {
        boatToDelete.boat = null;
      }
    }
    for (let i = 0; i < level.boats.length; i++) {
      if (level.boats[i].delete) {
        level.boats.splice(i, 1);
        break;
      }
    }
  } else {
    // island
    const x = Math.floor(xScaled);
    const y = Math.floor(yScaled);

    let island = level.islands.find(
      ({ x: foundX, y: foundY }) => foundX === x && foundY === y
    );
    if (island) {
      if (!island.b) {
        island.b = 8;
      } else if (island.b > 1) {
        island.b--;
      } else {
        deleteIsland(island);
      }
    } else {
      level.islands.push({ x, y, b: null, n: 0 });
    }
  }

  save();
  run();
};

levelElement.oncontextmenu = function (ev) {
  ev.preventDefault();
};

const resetButtonEl = document.getElementById('reset');

resetButtonEl.onclick = (ev) => {
  level.islands = [];
  level.boats = [];
  save();
  run();
};

generateYaml();
run();
