use crate::level::Level;
use std::char::from_digit;
use std::cmp::max;

pub fn print(l: Level) {
  let mut max_x = 0;
  let mut max_y = 0;
  for island in l.islands.iter() {
    max_x = max(max_x, island.x);
    max_y = max(max_y, island.y);
  }

  for boat_dock in l.boats.iter() {
    max_x = max(max_x, boat_dock.boat.x);
    max_x = max(max_x, boat_dock.dock.x);
    max_y = max(max_y, boat_dock.boat.y);
    max_y = max(max_y, boat_dock.dock.y);
  }

  let mut lines = vec![vec![' '; (max_x * 2 + 1).into()]; (max_y * 2 + 1).into()];
  for island in l.islands.iter() {
    let line_idx: usize = (island.y * 2).into();
    let range: std::ops::Range<usize> = (island.x * 2).into()..(island.x * 2 + 1).into();
    lines[line_idx].splice(range, vec![from_digit(island.b.into(), 10).unwrap_or('?')]);
  }
  for boat_dock in l.boats.iter() {
    let boat_line_idx: usize = (boat_dock.boat.y * 2 + 1).into();
    let range: std::ops::Range<usize> =
      (boat_dock.boat.x * 2 + 1).into()..(boat_dock.boat.x * 2 + 2).into();
    lines[boat_line_idx].splice(range, vec!['b']);
    let dock_line_idx: usize = (boat_dock.dock.y * 2 + 1).into();
    let range: std::ops::Range<usize> =
      (boat_dock.dock.x * 2 + 1).into()..(boat_dock.dock.x * 2 + 2).into();
    lines[dock_line_idx].splice(range, vec!['d']);
  }
  for bridge in l.bridges_h.iter() {
    let bridge_char = if bridge.n <= 1 { '━' } else { '═' };
    let line_idx: usize = (bridge.y * 2).into();
    let range: std::ops::Range<usize> = (bridge.x0 * 2 + 1).into()..(bridge.x1 * 2).into();
    let bridge_length: usize = ((bridge.x1 - bridge.x0) * 2 - 1).into();
    lines[line_idx].splice(range, vec![bridge_char; bridge_length]);
  }
  for bridge in l.bridges_v.iter() {
    let bridge_char = if bridge.n <= 1 { '|' } else { '║' };
    for i in (bridge.y0 * 2 + 1)..(bridge.y1 * 2) {
      let line_idx: usize = i.into();
      let range: std::ops::Range<usize> = (bridge.x * 2).into()..(bridge.x * 2 + 1).into();
      lines[line_idx].splice(range, vec![bridge_char]);
    }
  }
  for line in lines {
    let mut line_str = " ".to_string();
    for i in 0..line.len() {
      if i > 0 {
        if line[i - 1] == line[i] {
          line_str += &line[i].to_string();
        } else {
          line_str += " ";
        }
      }
      line_str += &line[i].to_string();
    }
    println!("{}", line_str);
  }
  // max(
  //   level.islands.reduce((max, island) => Math.max(max, island.x), 0),
  //   (level.boats || []).reduce(
  //     (max, { boat, dock }) => Math.max(max, boat.x, dock.x),
  //     0
  //   ) + 1
  // );
  // const maxY = Math.max(
  //   level.islands.reduce((max, island) => Math.max(max, island.y), 0),
  //   (level.boats || []).reduce(
  //     (max, { boat, dock }) => Math.max(max, boat.y, dock.y),
  //     0
  //   ) + 1
  // );
  // const lines = [];
  // for (let i = 0; i <= maxY * 2; i++) {
  //   const line = [];
  //   for (let j = 0; j <= maxX * 2; j++) {
  //     line.push(' ');
  //   }
  //   lines.push(line);
  // }
  // level.islands.forEach(({ x, y, b }) => {
  //   lines[y * 2].splice(x * 2, 1, b || '?');
  // });
  // if (level.boats) {
  //   level.boats.forEach(
  //     ({ boat: { x: bx, y: by }, dock: { x: dx, y: dy } }, i) => {
  //       lines[by * 2 + 1].splice(
  //         bx * 2 + 1,
  //         1,
  //         'b' + (level.boats.length > 1 ? i : '')
  //       );
  //       lines[dy * 2 + 1].splice(
  //         dx * 2 + 1,
  //         1,
  //         'd' + (level.boats.length > 1 ? i : '')
  //       );
  //     }
  //   );
  // }
  // level.bridgesH.forEach(({ x0, x1, y, n }) => {
  //   const str = n <= 1 ? '━' : '═';
  //   const insert = [];
  //   for (let i = 0; i < (x1 - x0) * 2 - 1; i++) {
  //     insert.push(str);
  //   }
  //   lines[y * 2].splice(x0 * 2 + 1, (x1 - x0) * 2 - 1, ...insert);
  // });
  // level.bridgesV.forEach(({ x, y0, y1, n }) => {
  //   const str = n <= 1 ? '│' : '║';
  //   for (let i = y0 * 2 + 1; i < y1 * 2; i++) {
  //     lines[i].splice(x * 2, 1, str);
  //   }
  // });
  // lines.forEach((line) => {
  //   let lineStr = ' ';
  //   for (let i = 0; i < line.length; i++) {
  //     if (i > 0 && ('' + line[i]).length <= 1) {
  //       // We want things spaced a bit for visual clarity but we want to make sure bridges don't have a bunch of gaps in them
  //       if (line[i - 1] === line[i]) {
  //         lineStr += line[i];
  //       } else {
  //         lineStr += ' ';
  //       }
  //     }
  //     lineStr += line[i];
  //   }
  //   console.log(lineStr);
  // });
}
