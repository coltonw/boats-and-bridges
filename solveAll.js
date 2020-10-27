const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { cloneDeep } = require('lodash');
const solve = require('./solver');

const hasMultipleSolutions = solve.hasMultipleSolutions;

const { levels, generated, testLevels } = yaml.safeLoad(
  fs.readFileSync(path.join(__dirname, 'levels.yml'))
);

const args = process.argv.slice(2);

let levelsToInclude = [...levels]; //, ...generated, ...testLevels]

if (args.length > 0) {
  levelsToInclude = [...levels, ...generated, ...testLevels];
}

levelsToInclude.forEach((level, i) => {
  try {
    if (
      args.length > 0 &&
      args.indexOf('' + i) === -1 &&
      args.indexOf(level.name) === -1
    ) {
      return;
    }
    console.log('');
    if (level.name) {
      console.log((args.length === 0 ? `Level ${i + 1}: ` : '') + level.name);
    }

    solve(cloneDeep(level), false, true);
    // hasMultipleSolutions(cloneDeep(level));
  } catch (e) {
    console.log(e);
  }
});
