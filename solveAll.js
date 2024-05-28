const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { cloneDeep } = require('lodash');
const solve = require('./solver');

const hasMultipleSolutions = solve.hasMultipleSolutions;
const fastSolve = solve.fastSolve;
const quiet = true;

const { levels, generated, testLevels } = yaml.safeLoad(
  fs.readFileSync(path.join(__dirname, 'levels.yml'))
);

const args = process.argv.slice(2);

let levelsToInclude = [...levels]; //, ...generated, ...testLevels]

if (args.length > 0) {
  levelsToInclude = [...levels, ...generated, ...testLevels];
}

if (args.join(' ') === 'profile') {
  levelsToInclude = [];
  for (let i = 0; i < 10; i++) {
    levelsToInclude = levelsToInclude.concat(levels);
  }
}

const heuristicsUsed = {};
levelsToInclude.forEach((level, i) => {
  try {
    if (
      args.length > 0 &&
      args.indexOf('' + i) === -1 &&
      args.join(' ') !== level.name &&
      args.join(' ') !== 'profile'
    ) {
      return;
    }
    quiet || console.log('');
    if (level.name) {
      quiet ||
        console.log((args.length === 0 ? `Level ${i + 1}: ` : '') + level.name);
    }

    const { heuristicsApplied } = solve.grouped(
      cloneDeep(level),
      quiet,
      args.length === 0
    );
    if (args.length === 0) {
      const hAlready = {};
      heuristicsApplied.forEach((h) => {
        if (hAlready[h]) {
          return;
        }
        if (heuristicsUsed[h]) {
          heuristicsUsed[h] = heuristicsUsed[h] + 1;
        } else {
          heuristicsUsed[h] = 1;
          quiet || console.log(`First use of "${h}"`);
        }
        hAlready[h] = true;
      });
    }
    args.length > 0 && hasMultipleSolutions(cloneDeep(level));
  } catch (e) {
    console.log(e);
  }
});

if (!quiet && Object.keys(heuristicsUsed).length > 0) {
  let s = '';
  Object.entries(heuristicsUsed).forEach(([h, numUses]) => {
    s += `${h}: ${numUses}, `;
  });

  console.log('');
  console.log('Levels containing the following heuristics:');
  console.log(s);
}
