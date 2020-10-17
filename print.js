module.exports = (level) => {
  const maxX = level.islands.reduce(
    (max, island) => Math.max(max, island.x),
    0
  );
  const maxY = level.islands.reduce(
    (max, island) => Math.max(max, island.y),
    0
  );
  const lines = [];
  for (let i = 0; i <= maxY * 2; i++) {
    const line = [];
    for (let j = 0; j <= maxX * 2; j++) {
      line.push(' ');
    }
    lines.push(line);
  }
  level.islands.forEach(({ x, y, b }) => {
    lines[y * 2].splice(x * 2, 1, b || '?');
  });
  level.bridgesH.forEach(({ x0, x1, y, n }) => {
    const str = n <= 1 ? '━' : '═';
    const insert = [];
    for (let i = 0; i < (x1 - x0) * 2 - 1; i++) {
      insert.push(str);
    }
    lines[y * 2].splice(x0 * 2 + 1, (x1 - x0) * 2 - 1, ...insert);
  });
  level.bridgesV.forEach(({ x, y0, y1, n }) => {
    const str = n <= 1 ? '│' : '║';
    for (let i = y0 * 2 + 1; i < y1 * 2; i++) {
      lines[i].splice(x * 2, 1, str);
    }
  });
  lines.forEach((line) => {
    let lineStr = ' ';
    for (let i = 0; i < line.length; i++) {
      if (i > 0) {
        // We want things spaced a bit for visual clarity but we want to make sure bridges don't have a bunch of gaps in them
        if (line[i - 1] === line[i]) {
          lineStr += line[i];
        } else {
          lineStr += ' ';
        }
      }
      lineStr += line[i];
    }
    console.log(lineStr);
  });
};
