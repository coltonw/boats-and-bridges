const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { camelCase, cloneDeep } = require('lodash');
const solve = require('./solver');

const { levels } = yaml.safeLoad(
  fs.readFileSync(path.join(__dirname, 'levels.yml'))
);

levels.forEach((level, i) => {
  const baseLevel = cloneDeep(level);
  try {
    if (level.name) {
      console.log(`Level ${i + 1}: ` + level.name);
    }

    solve(level, false, true);

    let output = {
      name: baseLevel.name,
      islands: baseLevel.islands,
      boats: baseLevel.boats || [],
      pirates: baseLevel.pirates || [],
      trucks: baseLevel.trucks || [],
      bridgesH: baseLevel.bridgesH || [],
      bridgesV: baseLevel.bridgesV || [],
      solution: {
        bridgesH: level.bridgesH,
        bridgesV: level.bridgesV,
      },
    };
    if (baseLevel.tip) {
      output = {
        name: baseLevel.name,
        tip: baseLevel.tip,
        islands: baseLevel.islands,
        boats: baseLevel.boats || [],
        pirates: baseLevel.pirates || [],
        trucks: baseLevel.trucks || [],
        bridgesH: baseLevel.bridgesH || [],
        bridgesV: baseLevel.bridgesV || [],
        solution: {
          bridgesH: level.bridgesH,
          bridgesV: level.bridgesV,
        },
      };
    }
    fs.writeFileSync(
      path.join(__dirname, `levels/${camelCase(baseLevel.name)}.yml`),
      yaml.safeDump(output)
    );
  } catch (e) {
    console.log(e);
  }
});
