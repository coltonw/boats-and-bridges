const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { cloneDeep } = require('lodash');
const solve = require('./solver');

const { levels } = yaml.safeLoad(
  fs.readFileSync(path.join(__dirname, 'levels.yml'))
);

const output = [];

levels.forEach((level, i) => {
  const baseLevel = cloneDeep(level);
  try {
    if (level.name) {
      console.log(`Level ${i + 1}: ` + level.name);
    }

    solve(level, false, true);

    output.push({
      islands: baseLevel.islands,
      solution: {
        bridgesH: level.bridgesH,
        bridgesV: level.bridgesV,
      },
      boats: baseLevel.boats || [],
      pirates: baseLevel.pirates || [],
      trucks: baseLevel.trucks || [],
    });
  } catch (e) {
    console.log(e);
  }
});

fs.writeFileSync(
  path.join(__dirname, 'levelsUnity.yaml'),
  yaml.safeDump({ levels: output })
);
