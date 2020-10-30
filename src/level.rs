#[derive(Debug)]
pub struct Island {
  pub x: u8,
  pub y: u8,
  pub b: u8,
  pub n: u8,
  pub unknown: bool,
}

#[derive(Debug)]
pub struct Point {
  pub x: u8,
  pub y: u8,
}

#[derive(Debug)]
pub struct BridgeH {
  pub x0: u8,
  pub x1: u8,
  pub y: u8,
  pub n: u8,
}

#[derive(Debug)]
pub struct BridgeV {
  pub x: u8,
  pub y0: u8,
  pub y1: u8,
  pub n: u8,
}

#[derive(Debug)]
pub struct BoatDock {
  pub boat: Point,
  pub dock: Point,
}

#[derive(Debug)]
pub struct Level {
  pub islands: Vec<Island>,
  pub boats: Vec<BoatDock>,
  pub bridges_h: Vec<BridgeH>,
  pub bridges_v: Vec<BridgeV>,
}
