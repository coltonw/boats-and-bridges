const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { cloneDeep } = require('lodash');
const solve = require('./solver');

const hasMultipleSolutions = solve.hasMultipleSolutions;

const { levels, testLevels } = yaml.safeLoad(
  fs.readFileSync(path.join(__dirname, 'levels.yml'))
);

const args = process.argv.slice(2);

[...levels, ...testLevels].forEach((level, i) => {
  try {
    if (args.length > 0 && args.indexOf('' + i) === -1 && args.indexOf(level.name) === -1) {
      return;
    }
    console.log('');
    if (level.name) {
      console.log(level.name);
    }
    solve(cloneDeep(level));
    hasMultipleSolutions(cloneDeep(level));
  } catch (e) {
    console.log(e);
  }
});
