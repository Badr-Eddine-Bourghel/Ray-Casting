const EPS = 1e-3;
const NEAR_CLIPPING_PLANE = 1;
const FOV = Math.PI * 0.5;
const SCREEN_WIDTH = 100;

class Vector2 {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static fromAngle(angle: number): Vector2 {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  add(that: Vector2): Vector2 {
    return new Vector2(this.x + that.x, this.y + that.y);
  }

  sub(that: Vector2): Vector2 {
    return new Vector2(this.x - that.x, this.y - that.y);
  }

  scale(option: number): Vector2 {
    return new Vector2(this.x * option, this.y * option);
  }

  div(that: Vector2): Vector2 {
    return new Vector2(this.x / that.x, this.y / that.y);
  }

  mul(that: Vector2): Vector2 {
    return new Vector2(this.x * that.x, this.y * that.y);
  }

  length(): number {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  norm(): Vector2 {
    const l = this.length();
    if (l === 0) return new Vector2(0, 0);
    return new Vector2(this.x / l, this.y / l);
  }

  distanceTo(that: Vector2): number {
    return that.sub(this).length();
  }

  lerp(that: Vector2, t: number): Vector2 {
    return that.sub(this).scale(t).add(this);
  }

  array(): [number, number] {
    return [this.x, this.y];
  }

  rot90(): Vector2 {
    return new Vector2(-this.y, this.x);
  }
}

function canvasSize(ctx: CanvasRenderingContext2D): Vector2 {
  return new Vector2(ctx.canvas.width, ctx.canvas.height);
}

function fillCircle(
  ctx: CanvasRenderingContext2D,
  p1: Vector2,
  radius: number,
) {
  ctx.beginPath();
  ctx.arc(...p1.array(), radius, 0, 2 * Math.PI);
  ctx.fill();
}

function strokeLine(ctx: CanvasRenderingContext2D, p1: Vector2, p2: Vector2) {
  ctx.beginPath();
  ctx.moveTo(...p1.array());
  ctx.lineTo(...p2.array());
  ctx.stroke();
}

function snap(x: number, dx: number): number {
  if (dx > 0) return Math.ceil(x + EPS);
  if (dx < 0) return Math.floor(x - EPS);
  return x;
}

function hittingCell(p1: Vector2, p2: Vector2): Vector2 {
  const d = p2.sub(p1);
  return new Vector2(
    Math.floor(p2.x + Math.sign(d.x) * EPS),
    Math.floor(p2.y + Math.sign(d.y) * EPS),
  );
}

function rayStep(p1: Vector2, p2: Vector2): Vector2 {
  let p3 = p2;
  const d = p2.sub(p1);
  if (d.x != 0) {
    const k = d.y / d.x;
    const c = p1.y - k * p1.x;

    {
      const x3 = snap(p2.x, d.x);
      const y3 = x3 * k + c;
      p3 = new Vector2(x3, y3);
    }

    if (k !== 0) {
      const y3 = snap(p2.y, d.y);
      const x3 = (y3 - c) / k;
      const p3t = new Vector2(x3, y3);
      if (p2.distanceTo(p3t) < p2.distanceTo(p3)) {
        p3 = p3t;
      }
    }
  } else {
    const y3 = snap(p2.y, d.y);
    const x3 = p2.x;
    p3 = new Vector2(x3, y3);
  }
  return p3;
}

type Scene = Array<Array<number>>;

function castRay(scene: Scene, p1: Vector2, p2: Vector2): Vector2 {
  throw new Error("CastRay not implemented");
}

function sceneSize(scene: Scene): Vector2 {
  const y = scene.length;
  let x = Number.MIN_VALUE;
  for (let row of scene) {
    x = Math.max(x, row.length);
  }
  return new Vector2(x, y);
}

function minimap(
  ctx: CanvasRenderingContext2D,
  player: Player,
  position: Vector2,
  size: Vector2,
  scene: Array<Array<number>>,
) {
  ctx.save();
  ctx.fillStyle = "#181818";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const gridSize = sceneSize(scene);

  ctx.translate(...position.array());
  ctx.scale(...size.div(gridSize).array());
  ctx.lineWidth = 0.1;

  for (let y = 0; y < gridSize.y; ++y) {
    for (let x = 0; x < gridSize.x; ++x) {
      if (scene[y][x] !== 0) {
        ctx.fillStyle = "#303030";
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  ctx.strokeStyle = "#303030";
  for (let x = 0; x <= gridSize.x; ++x) {
    strokeLine(ctx, new Vector2(x, 0), new Vector2(x, gridSize.y));
  }

  for (let y = 0; y <= gridSize.y; ++y) {
    strokeLine(ctx, new Vector2(0, y), new Vector2(gridSize.x, y));
  }

  ctx.fillStyle = "magenta";
  fillCircle(ctx, player.position, 0.2);

  const [p1, p2] = player.fovRange();

  ctx.strokeStyle = "magenta";
  strokeLine(ctx, p1, p2);
  strokeLine(ctx, player.position, p1);
  strokeLine(ctx, player.position, p2);

  ctx.restore();
}

class Player {
  position: Vector2;
  direction: number;
  constructor(position: Vector2, direction: number) {
    this.position = position;
    this.direction = direction;
  }

  fovRange(): [Vector2, Vector2] {
    const l = Math.tan(FOV * 0.5) * NEAR_CLIPPING_PLANE;
    const p = this.position.add(
      Vector2.fromAngle(this.direction).scale(NEAR_CLIPPING_PLANE),
    );
    const p1 = p.add(p.sub(this.position).rot90().norm().scale(l));
    const p2 = p.sub(p.sub(this.position).rot90().norm().scale(l));
    return [p1, p2];
  }
}

function render(ctx: CanvasRenderingContext2D, player: Player, scene: Scene) {
  const [r1, r2] = player.fovRange();

  for (let x = 0; x < SCREEN_WIDTH; ++x) {
    const p = castRay(scene, player.position, r1.lerp(r2, x / SCREEN_WIDTH));
    const c = hittingCell(player.position, p);
  }
}

(() => {
  let scene = [
    [0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];
  const game = document.getElementById("game") as HTMLCanvasElement | null;
  if (game === null) {
    throw new Error("No canvas with id 'game' is found");
  }
  const ctx = game.getContext("2d");
  const factor = 80;
  game.width = 16 * factor;
  game.height = 9 * factor;
  if (ctx === null) {
    throw new Error("2d context is not supported ");
  }

  let player = new Player(
    sceneSize(scene).mul(new Vector2(0.63, 0.63)),
    Math.PI * 1.25,
  );
  let minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.03));
  let cellSize = ctx.canvas.width * 0.06;
  let minimapSize = sceneSize(scene).scale(cellSize);
  render(ctx, player, scene);
  minimap(ctx, player, minimapPosition, minimapSize, scene);
})();
