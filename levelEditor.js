import solver from './solver.js';
import { clear } from './utils';
import yaml from 'js-yaml';
import { debounce } from 'lodash';

const levelElement = document.getElementById('level');

const scale = 15;

let storedLevel = null;
try {
  storedLevel = JSON.parse(localStorage.getItem('inProgressLevel'));
} catch (e) {}

const level = storedLevel || {
  islands: [],
  bridgesH: [],
  bridgesV: [],
  boats: [],
  pirates: [],
  trucks: [],
};

// temporary
level.trucks = level.trucks || [];

let showBridges = true;

let timeouts = [];

const save = () => {
  renderLevel();
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

const loadYaml = () => {
  const yamlEl = document.getElementById('yaml');
  const yamlStr = yamlEl.value;
  try {
    const levelYaml = yaml.load(yamlStr);
    level.islands = levelYaml.islands || [];
    level.boats = levelYaml.boats || [];
    level.pirates = levelYaml.pirates || [];
    level.trucks = levelYaml.trucks || [];
  } catch (e) {
    console.log(e);
  }
};

const solveAndRender = (quiet = false) => {
  clear(level);
  let solution = null;
  try {
    // No nested guessing because it takes too long and crashes the browser
    solution = solver(level, quiet, false, true);
  } catch (e) {
    console.log(e);
  }
  if (solution) {
    timeouts.forEach((t) => clearTimeout(t));
    timeouts = [];
    timeouts.push(
      setTimeout(() => {
        clear(level);
        const multipleSolutions = solver.hasMultipleSolutions(level, true, 4);
        if (multipleSolutions) {
          renderLevel();
          timeouts.push(setTimeout(() => run(true), 1200));
        } else if (
          solution.heuristicsApplied.indexOf(solver.heuristics.length - 2) >
            -1 ||
          solution.heuristicsApplied.indexOf(solver.heuristics.length - 1) > -1
        ) {
          clear(level);
          try {
            solver(level, true, true);
          } catch (e) {}
          renderLevel();
          timeouts.push(setTimeout(() => run(true), 1200));
        }
      }, 2000)
    );
  }

  renderLevel();
};

const solveAndRenderDebounced = debounce(solveAndRender, 800);

const run = (quiet = false) => {
  timeouts.forEach((t) => clearTimeout(t));
  timeouts = [];
  solveAndRenderDebounced(quiet);
};

const boatColors = [
  'green',
  'gold',
  'steelblue',
  'purple',
  'orange',
  'deeppink',
  'palevioletred',
];

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
  if (showBridges) {
    level.bridgesH.forEach(({ x0, x1, y, n }) => {
      const bridgeEl = document.createElement('div');
      bridgeEl.setAttribute('class', `bridgeH ${n > 1 ? 'double' : ''}`);
      bridgeEl.setAttribute(
        'style',
        `left: ${
          (levelElement.offsetWidth / scale) * (x0 + 0.5) + 18
        }px; top: ${(levelElement.offsetHeight / scale) * y}px; width: ${
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
  }

  level.boats.forEach(({ boat, dock }, i) => {
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

      const jibEl = document.createElement('div');
      jibEl.setAttribute('class', 'jib-sail');
      jibEl.setAttribute(
        'style',
        `left: ${(levelElement.offsetWidth / scale) * (boat.x + 0.5)}px; top: ${
          (levelElement.offsetHeight / scale) * (boat.y + 0.5)
        }px;`
      );

      levelElement.appendChild(jibEl);

      const boatEl = document.createElement('div');
      boatEl.setAttribute('class', 'boat');
      boatEl.setAttribute(
        'style',
        `left: ${(levelElement.offsetWidth / scale) * (boat.x + 0.5)}px; top: ${
          (levelElement.offsetHeight / scale) * (boat.y + 0.5)
        }px;${
          level.boats.length > 1 ? `background-color: ${boatColors[i]};` : ''
        }`
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
        }px;${
          level.boats.length > 1 ? `background-color: ${boatColors[i]};` : ''
        }`
      );
      levelElement.appendChild(dockEl);
    }
  });

  level.pirates.forEach((pirate) => {
    const sailEl = document.createElement('div');
    sailEl.setAttribute('class', 'bottom-sail');
    sailEl.setAttribute(
      'style',
      `left: ${(levelElement.offsetWidth / scale) * (pirate.x + 0.5)}px; top: ${
        (levelElement.offsetHeight / scale) * (pirate.y + 0.5)
      }px;`
    );

    levelElement.appendChild(sailEl);

    const jibEl = document.createElement('div');
    jibEl.setAttribute('class', 'top-sail');
    jibEl.setAttribute(
      'style',
      `left: ${(levelElement.offsetWidth / scale) * (pirate.x + 0.5)}px; top: ${
        (levelElement.offsetHeight / scale) * (pirate.y + 0.5)
      }px;`
    );

    levelElement.appendChild(jibEl);

    const flagEl = document.createElement('div');
    flagEl.setAttribute('class', 'pirate-flag');
    flagEl.setAttribute(
      'style',
      `left: ${(levelElement.offsetWidth / scale) * (pirate.x + 0.5)}px; top: ${
        (levelElement.offsetHeight / scale) * (pirate.y + 0.5)
      }px;`
    );

    levelElement.appendChild(flagEl);

    const boatEl = document.createElement('div');
    boatEl.setAttribute('class', 'boat');
    boatEl.setAttribute(
      'style',
      `left: ${(levelElement.offsetWidth / scale) * (pirate.x + 0.5)}px; top: ${
        (levelElement.offsetHeight / scale) * (pirate.y + 0.5)
      }px; background-color: #855e42;`
    );

    levelElement.appendChild(boatEl);
  });

  level.trucks.forEach(({ truck, garage }) => {
    if (truck) {
      const truckEl = document.createElement('div');
      truckEl.setAttribute('class', 'truck');
      truckEl.setAttribute(
        'style',
        `left: ${(levelElement.offsetWidth / scale) * truck.x}px; top: ${
          (levelElement.offsetHeight / scale) * truck.y
        }px;`
      );

      truckEl.innerHTML = '🚚';
      levelElement.appendChild(truckEl);
    }
    if (garage) {
      const garageEl = document.createElement('div');
      garageEl.setAttribute('class', 'garage');
      garageEl.setAttribute(
        'style',
        `left: ${(levelElement.offsetWidth / scale) * garage.x}px; top: ${
          (levelElement.offsetHeight / scale) * garage.y
        }px;`
      );

      garageEl.innerHTML = '🏭';
      levelElement.appendChild(garageEl);
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

let nextClick = null;

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
  if (nextClick === 'truck' || nextClick === 'garage') {
    const x = Math.floor(xScaled);
    const y = Math.floor(yScaled);
    const truckObj = level.trucks.find((t) => !t[nextClick]);
    if (truckObj) {
      truckObj[nextClick] = { x, y };
    } else if (nextClick === 'truck') {
      level.trucks.push({ truck: { x, y }, garage: null });
    } else {
      level.trucks.push({ truck: null, garage: { x, y } });
    }
    nextClick = null;
    const infoEl = document.getElementById('info');
    infoEl.innerText = '';
  } else if (
    Math.abs(0.5 - (xScaled % 1)) > 0.25 &&
    Math.abs(0.5 - (yScaled % 1)) > 0.25
  ) {
    // boat
    const x = Math.floor(xScaled - 0.5);
    const y = Math.floor(yScaled - 0.5);
    let pirateDeleted = false;
    for (let i = 0; i < level.pirates.length; i++) {
      if (level.pirates[i].x === x && level.pirates[i].y === y) {
        level.pirates.splice(i, 1);
        pirateDeleted = true;
        break;
      }
    }
    if (!pirateDeleted) {
      const boatInProgress = level.boats.find(
        ({ boat, dock }) => !boat || !dock
      );
      if (boatInProgress) {
        if (!boatInProgress.boat) {
          boatInProgress.boat = { x, y };
        } else {
          boatInProgress.dock = { x, y };
        }
      } else {
        level.boats.push({ boat: { x, y }, dock: null });
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
  if (nextClick === 'truck' || nextClick === 'garage') {
    const x = Math.floor(xScaled);
    const y = Math.floor(yScaled);
    const garageToDelete = level.trucks.find(
      ({ garage }) => garage && garage.x === x && garage.y === y
    );
    const truckToDelete = level.trucks.find(
      ({ truck }) => truck && truck.x === x && truck.y === y
    );
    let truckDeleted = false;
    if (nextClick === 'garage' && garageToDelete) {
      truckDeleted = true;
      if (!garageToDelete.truck) {
        garageToDelete.delete = true;
      } else {
        garageToDelete.garage = null;
      }
    } else if (nextClick === 'truck' && truckToDelete) {
      truckDeleted = true;
      if (!truckToDelete.garage) {
        truckToDelete.delete = true;
      } else {
        truckToDelete.truck = null;
      }
    }
    for (let i = 0; i < level.trucks.length; i++) {
      if (level.trucks[i].delete) {
        level.trucks.splice(i, 1);
        break;
      }
    }
    nextClick = null;
    const infoEl = document.getElementById('info');
    infoEl.innerText = '';
  } else if (
    Math.abs(0.5 - (xScaled % 1)) > 0.25 &&
    Math.abs(0.5 - (yScaled % 1)) > 0.25
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
    let boatDeleted = false;
    if (dockToDelete) {
      boatDeleted = true;
      if (!dockToDelete.boat) {
        dockToDelete.delete = true;
      } else {
        dockToDelete.dock = null;
      }
    } else if (boatToDelete) {
      boatDeleted = true;
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
    if (
      !boatDeleted &&
      !level.pirates.find((pirate) => pirate.x === x && pirate.y === y)
    ) {
      level.pirates.push({ x, y });
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

document.onkeydown = (e) => {
  if (e.key === 't') {
    const infoEl = document.getElementById('info');
    nextClick = 'truck';
    infoEl.innerText = 'Placing truck...';
  }
  if (e.key === 'g') {
    const infoEl = document.getElementById('info');
    nextClick = 'garage';
    infoEl.innerText = 'Placing garage...';
  }
};

const resetButtonEl = document.getElementById('reset');

resetButtonEl.onclick = (ev) => {
  level.islands = [];
  level.boats = [];
  level.pirates = [];
  save();
  run();
};

const hideBridgesButtonEl = document.getElementById('hideBridges');

hideBridgesButtonEl.onclick = (ev) => {
  showBridges = !showBridges;
  if (showBridges) {
    hideBridgesButtonEl.innerHTML = 'Hide Bridges';
  } else {
    hideBridgesButtonEl.innerHTML = 'Show Bridges';
  }
  run();
};

const compressEl = document.getElementById('compress');

compressEl.onclick = (ev) => {
  const xCompress = [];
  const yCompress = [];

  const [xMaxIsl, yMaxIsl] = level.islands.reduce(
    ([mx, my], { x, y }) => [Math.max(mx, x), Math.max(my, y)],
    [0, 0]
  );
  const [xMaxB, yMaxB] = level.boats.reduce(
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
  const [xMax, yMax] = level.pirates.reduce(
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

  level.trucks.forEach(({ truck, garage }) => {
    if (truck) {
      truck.x = truck.x - xCompress[truck.x];
      truck.y = truck.y - yCompress[truck.y];
    }
    if (garage) {
      garage.x = garage.x - xCompress[garage.x];
      garage.y = garage.y - yCompress[garage.y];
    }
  });

  level.boats.forEach(({ boat, dock }) => {
    if (boat) {
      boat.x = boat.x - xCompress[boat.x];
      boat.y = boat.y - yCompress[boat.y];
    }
    if (dock) {
      dock.x = dock.x - xCompress[dock.x];
      dock.y = dock.y - yCompress[dock.y];
    }
  });

  level.pirates.forEach((pirate) => {
    pirate.x = pirate.x - xCompress[pirate.x];
    pirate.y = pirate.y - yCompress[pirate.y];
  });
  save();
  run();
};

const yamlEl = document.getElementById('yaml');

yamlEl.onchange = (ev) => {
  loadYaml();
  run();
};

generateYaml();
run();
