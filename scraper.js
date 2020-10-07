const yaml = require('js-yaml');
const solve = require('./solver');

// this should be pasted into the console on puzzle-bridges.com
function scrape() {
  const level = {
    islands: [],
    bridgesH: [],
    bridgesV: [],
  };
  $('.bridges-task-cell').each((i, elem) => {
    level.islands.push({
      x: parseInt($(elem).css('left'), 10) / 18,
      y: parseInt($(elem).css('top'), 10) / 18,
      b: parseInt($(elem).text(), 10),
      n: 0,
    });
  });
  return JSON.stringify(level);
}

const level = {
  islands: [
    { x: 0, y: 0, b: 3, n: 0 },
    { x: 9, y: 0, b: 2, n: 0 },
    { x: 1, y: 1, b: 3, n: 0 },
    { x: 3, y: 1, b: 3, n: 0 },
    { x: 6, y: 1, b: 4, n: 0 },
    { x: 8, y: 1, b: 1, n: 0 },
    { x: 1, y: 3, b: 4, n: 0 },
    { x: 6, y: 3, b: 5, n: 0 },
    { x: 9, y: 3, b: 4, n: 0 },
    { x: 3, y: 4, b: 4, n: 0 },
    { x: 5, y: 4, b: 3, n: 0 },
    { x: 1, y: 5, b: 2, n: 0 },
    { x: 6, y: 5, b: 3, n: 0 },
    { x: 8, y: 5, b: 2, n: 0 },
    { x: 0, y: 6, b: 4, n: 0 },
    { x: 2, y: 6, b: 2, n: 0 },
    { x: 5, y: 6, b: 1, n: 0 },
    { x: 3, y: 7, b: 4, n: 0 },
    { x: 6, y: 7, b: 3, n: 0 },
    { x: 9, y: 7, b: 2, n: 0 },
    { x: 0, y: 8, b: 1, n: 0 },
    { x: 2, y: 8, b: 2, n: 0 },
    { x: 7, y: 8, b: 1, n: 0 },
    { x: 1, y: 9, b: 2, n: 0 },
    { x: 4, y: 9, b: 3, n: 0 },
    { x: 8, y: 9, b: 2, n: 0 },
  ],
  bridgesH: [],
  bridgesV: [],
};

// solve(level);

console.log(yaml.safeDump(level));
