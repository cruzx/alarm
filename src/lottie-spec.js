export function buildLottie() {
  const width = 1080;
  const height = 1080;
  const fps = 30;
  const totalFrames = 90;
  const cx = width / 2;
  const cy = height / 2;
  const gold = [1, 0.7843, 0.2706, 1];
  const darkGold = [0.7882, 0.5137, 0.0745, 1];
  const hotGold = [1, 0.9373, 0.5804, 1];

  const ellipse = (name, size, fill, stroke = null, strokeWidth = 0) => {
    const items = [
      {
        ty: "el",
        nm: `${name} ellipse`,
        p: { a: 0, k: [0, 0] },
        s: { a: 0, k: size },
      },
      {
        ty: "fl",
        nm: `${name} fill`,
        c: { a: 0, k: fill },
        o: { a: 0, k: 100 },
        r: 1,
      },
    ];

    if (stroke) {
      items.push({
        ty: "st",
        nm: `${name} stroke`,
        c: { a: 0, k: stroke },
        o: { a: 0, k: 100 },
        w: { a: 0, k: strokeWidth },
        lc: 2,
        lj: 2,
      });
    }

    items.push({
      ty: "tr",
      p: { a: 0, k: [0, 0] },
      a: { a: 0, k: [0, 0] },
      s: { a: 0, k: [100, 100] },
      r: { a: 0, k: 0 },
      o: { a: 0, k: 100 },
    });

    return { ty: "gr", nm: name, it: items };
  };

  const rect = (name, size, fill, x, y, rotation = 0) => ({
    ty: "gr",
    nm: name,
    it: [
      {
        ty: "rc",
        nm: `${name} rect`,
        p: { a: 0, k: [0, 0] },
        s: { a: 0, k: size },
        r: { a: 0, k: size[0] / 2 },
      },
      {
        ty: "fl",
        nm: `${name} fill`,
        c: { a: 0, k: fill },
        o: { a: 0, k: 100 },
        r: 1,
      },
      {
        ty: "tr",
        p: { a: 0, k: [x, y] },
        a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] },
        r: { a: 0, k: rotation },
        o: { a: 0, k: 100 },
      },
    ],
  });

  const coinScale = {
    a: 1,
    k: [
      { t: 0, s: [100, 100, 100], e: [8, 102, 100], i: { x: [0.65], y: [1] }, o: { x: [0.35], y: [0] } },
      { t: totalFrames / 4, s: [8, 102, 100], e: [100, 100, 100], i: { x: [0.65], y: [1] }, o: { x: [0.35], y: [0] } },
      { t: totalFrames / 2, s: [100, 100, 100], e: [8, 102, 100], i: { x: [0.65], y: [1] }, o: { x: [0.35], y: [0] } },
      { t: (totalFrames * 3) / 4, s: [8, 102, 100], e: [100, 100, 100], i: { x: [0.65], y: [1] }, o: { x: [0.35], y: [0] } },
      { t: totalFrames, s: [100, 100, 100] },
    ],
  };

  return {
    v: "5.12.2",
    fr: fps,
    ip: 0,
    op: totalFrames,
    w: width,
    h: height,
    nm: "Rotating Coin Lottie Companion",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "coin vector spin",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: totalFrames, s: [360] }] },
          p: { a: 0, k: [cx, cy, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: coinScale,
        },
        shapes: [
          ellipse("outer coin", [520, 520], gold, hotGold, 18),
          ellipse("inner stamped ring", [350, 350], gold, darkGold, 12),
          rect("center stroke one", [42, 240], hotGold, -78, 0, -12),
          rect("center stroke two", [42, 300], hotGold, 0, 0, 0),
          rect("center stroke three", [42, 240], hotGold, 78, 0, 12),
          rect("shine slash", [26, 390], [1, 0.9765, 0.7608, 1], 125, -40, 28),
        ],
        ip: 0,
        op: totalFrames,
        st: 0,
        bm: 0,
      },
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: "soft shadow",
        sr: 1,
        ks: {
          o: { a: 1, k: [{ t: 0, s: [34], e: [18] }, { t: totalFrames / 2, s: [18], e: [34] }, { t: totalFrames, s: [34] }] },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [cx, cy + 270, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 1, k: [{ t: 0, s: [100, 24, 100], e: [54, 18, 100] }, { t: totalFrames / 2, s: [54, 18, 100], e: [100, 24, 100] }, { t: totalFrames, s: [100, 24, 100] }] },
        },
        shapes: [ellipse("shadow", [430, 120], [0, 0, 0, 1])],
        ip: 0,
        op: totalFrames,
        st: 0,
        bm: 0,
      },
    ],
  };
}
