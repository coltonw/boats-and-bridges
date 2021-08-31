const Jimp = require('jimp');

function wrappedBlit(image, stroke, x, y) {
  const iW = image.bitmap.width;
  const iH = image.bitmap.height;
  const sW = stroke.bitmap.width;
  const sH = stroke.bitmap.height;
  // image.blit( src, x, y, [srcx, srcy, srcw, srch] )
  let result = image.blit(stroke, x, y);
  if (x + sW > iW) {
    result = result.blit(stroke, x - iW, y);
  }
  if (y + sH > iH) {
    result = result.blit(stroke, x, y - iH);
  }
  if (x + sW > iW && y + sH > iH) {
    result = result.blit(stroke, x - iW, y - iH);
  }
  return result;
}

function onLine(a0, a1, p) {
  if (
    p.x <= Math.max(a0.x, a1.x) &&
    p.x <= Math.min(a0.x, a1.x) &&
    p.y <= Math.max(a0.y, a1.y) &&
    p.y <= Math.min(a0.y, a1.y)
  )
    return true;

  return false;
}

function direction(a, b, c) {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (value === 0) return 'collinear';
  else if (value < 0) return 'anti-clockwise';
  return 'clockwise';
}

function segmentsIntersect(a0, a1, b0, b1) {
  dir1 = direction(a0, a1, b0);
  dir2 = direction(a0, a1, b1);
  dir3 = direction(b0, b1, a0);
  dir4 = direction(b0, b1, a1);

  if (dir1 !== dir2 && dir3 !== dir4) return true;
  if (dir1 === 'collinear' && onLine(a0, a1, b0)) return true;
  if (dir2 === 'collinear' && onLine(a0, a1, b1)) return true;
  if (dir3 === 'collinear' && onLine(b0, b1, a0)) return true;
  if (dir4 === 'collinear' && onLine(b0, b1, a1)) return true;
  return false;
}

function sqr(x) {
  return x * x;
}

function dist2(v, w) {
  return sqr(v.x - w.x) + sqr(v.y - w.y);
}

function distToSegmentSquared(p, v, w) {
  var l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
}

function distToSegment(p, v, w) {
  return Math.sqrt(distToSegmentSquared(p, v, w));
}

// Tried this and it didn't work: https://stackoverflow.com/a/28701387
function segmentDistance(a0, a1, b0, b1) {
  if (segmentsIntersect(a0, a1, b0, b1)) {
    return 0;
  }

  let min = 10000000000;
  min = Math.min(distToSegment(b0, a0, a1), min);
  min = Math.min(distToSegment(b1, a0, a1), min);
  min = Math.min(distToSegment(a0, b0, b1), min);
  min = Math.min(distToSegment(a1, b0, b1), min);

  return min;
}

function averageDarkness(image) {
  let totalDarkness = 0;
  for (let x = 0; x < image.bitmap.width; x++) {
    for (let y = 0; y < image.bitmap.height; y++) {
      const idx = image.getPixelIndex(x, y);
      // since this is grayscale, we only look at the red
      totalDarkness += 255 - image.bitmap.data[idx + 0];
    }
  }
  return totalDarkness / (image.bitmap.width * image.bitmap.height);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function getEndpoints(x, y, length, angle) {
  const radians = Math.abs((angle / 180) * Math.PI);
  return [x, y, x + length * Math.cos(radians), y + length * Math.sin(radians)];
}

// ratios of how important various numbers are to the quality
const minRatio = 4;
const avgRatio = 1;
function lineQuality(line, lines, size) {
  let min = 10000000;
  let sum = 0;
  for (let i = 0; i < lines.length; i++) {
    const [a0x, a0y, a1x, a1y] = getEndpoints(
      line.x,
      line.y,
      line.length,
      line.angle
    );
    const [b0x, b0y, b1x, b1y] = getEndpoints(
      lines[i].x,
      lines[i].y,
      lines[i].length,
      lines[i].angle
    );

    // ---
    // -X-
    // ---
    let d = segmentDistance(
      { x: a0x, y: a0y },
      { x: a1x, y: a1y },
      { x: b0x, y: b0y },
      { x: b1x, y: b1y }
    );

    // ---
    // --X
    // ---
    d = Math.min(
      d,
      segmentDistance(
        { x: a0x + size, y: a0y },
        { x: a1x + size, y: a1y },
        { x: b0x, y: b0y },
        { x: b1x, y: b1y }
      )
    );

    // ---
    // ---
    // --X
    d = Math.min(
      d,
      segmentDistance(
        { x: a0x + size, y: a0y + size },
        { x: a1x + size, y: a1y + size },
        { x: b0x, y: b0y },
        { x: b1x, y: b1y }
      )
    );

    // ---
    // ---
    // -X-
    d = Math.min(
      d,
      segmentDistance(
        { x: a0x, y: a0y + size },
        { x: a1x, y: a1y + size },
        { x: b0x, y: b0y },
        { x: b1x, y: b1y }
      )
    );

    // ---
    // ---
    // X--
    d = Math.min(
      d,
      segmentDistance(
        { x: a0x - size, y: a0y + size },
        { x: a1x - size, y: a1y + size },
        { x: b0x, y: b0y },
        { x: b1x, y: b1y }
      )
    );

    // ---
    // X--
    // ---
    d = Math.min(
      d,
      segmentDistance(
        { x: a0x - size, y: a0y },
        { x: a1x - size, y: a1y },
        { x: b0x, y: b0y },
        { x: b1x, y: b1y }
      )
    );

    // X--
    // ---
    // ---
    d = Math.min(
      d,
      segmentDistance(
        { x: a0x - size, y: a0y - size },
        { x: a1x - size, y: a1y - size },
        { x: b0x, y: b0y },
        { x: b1x, y: b1y }
      )
    );

    // -X-
    // --X
    // ---
    d = Math.min(
      d,
      segmentDistance(
        { x: a0x, y: a0y - size },
        { x: a1x, y: a1y - size },
        { x: b0x, y: b0y },
        { x: b1x, y: b1y }
      )
    );

    // --X
    // ---
    // ---
    d = Math.min(
      d,
      segmentDistance(
        { x: a0x + size, y: a0y - size },
        { x: a1x + size, y: a1y - size },
        { x: b0x, y: b0y },
        { x: b1x, y: b1y }
      )
    );

    min = Math.min(min, d);
    sum += d;
  }

  return (sum / lines.length) * avgRatio + min * minRatio;
}

function getRandomLine(size, maxAngle, scale) {
  scale = scale || Math.random() * 0.4 + 0.6;
  return {
    x: getRandomInt(size),
    y: getRandomInt(size),
    scale,
    length: scale * size,
    angle: getRandomInt(maxAngle * 2 + 1) - maxAngle,
  };
}

const randomAttempts = 40;
function getLines(size, maxAngle, number) {
  const lines = [getRandomLine(size, maxAngle)];
  for (let i = 1; i < number; i++) {
    let line = null;
    let bestLineQuality = 0;
    // scale is picked once per line otherwise the algorithm will
    // always be biased toward short lines
    const scale = Math.random() * 0.4 + 0.6;
    for (let j = 0; j < randomAttempts; j++) {
      const testLine = getRandomLine(size, maxAngle, scale);
      const testQuality = lineQuality(testLine, lines, size);
      if (testQuality > bestLineQuality || line === null) {
        bestLineQuality = testQuality;
        line = testLine;
      }
    }
    lines.push(line);
  }
  return lines;
}

let size = 512;
let strokeWidth = 10;
const maxAngle = 3;

size = size * 4;
strokeWidth = strokeWidth * 4;
new Jimp(size, size, 0xffffffff, (err, image) => {
  if (err) throw err;
  // for denser stuff we will want to use darkness
  // console.log('Darkness before: ', averageDarkness(image));
  Jimp.read('./stroke.png').then((stroke) => {
    stroke = stroke.resize(size, strokeWidth);
    const lines = getLines(size, maxAngle, 20);
    for (let i = 0; i < lines.length; i++) {
      let modifiedStroke = stroke.clone().resize(lines[i].length, strokeWidth);
      // rotating is performance heavy so we are currently only doing it for 20 lines
      if (i < 20) {
        modifiedStroke = modifiedStroke.rotate(lines[i].angle);
      }
      image = wrappedBlit(image, modifiedStroke, lines[i].x, lines[i].y);
      // console.log('Darkness: ', averageDarkness(image));
    }
    image.scale(0.25).write('blank.png');
  });
});
