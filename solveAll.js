const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { cloneDeep } = require('lodash');
const solve = require('./solver');

const hasMultipleSolutions = solve.hasMultipleSolutions;

const { levels, testLevels } = yaml.safeLoad(
  fs.readFileSync(path.join(__dirname, 'levels.yml'))
);

[...levels, ...testLevels].forEach((level) => {
  try {
    solve(cloneDeep(level));
    hasMultipleSolutions(cloneDeep(level));
  } catch (e) {
    console.log(e);
  }
});
