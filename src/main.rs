mod level;
mod print;

use level::{BridgeH, Island, Level};

fn main() {
    let my_level = Level {
        islands: vec![
            Island {
                x: 0,
                y: 0,
                b: 1,
                n: 0,
                unknown: true,
            },
            Island {
                x: 1,
                y: 0,
                b: 1,
                n: 0,
                unknown: true,
            },
        ],
        boats: vec![],
        bridges_h: vec![BridgeH {
            x0: 0,
            x1: 1,
            y: 0,
            n: 1,
        }],
        bridges_v: vec![],
    };
    print::print(my_level);
}
