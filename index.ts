class Vector2 {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
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

  array(): [number, number] {
    return [this.x, this.y];
  }
}

const GRID_ROWS = 10;
const GRID_COLS = 10;
const GRID_SIZE = new Vector2(GRID_COLS, GRID_ROWS);

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

function snap(x: number, dx: number, eps: number): number {
  if (dx > 0) return Math.ceil(x + eps);
  if (dx < 0) return Math.floor(x - eps);
  return x;
}

function rayStep(p1: Vector2, p2: Vector2): Vector2 {
  const eps = 1e-3;
  let p3 = p2;
  const d = p2.sub(p1);
  if (d.x != 0) {
    const k = d.y / d.x;
    const c = p1.y - k * p1.x;

    {
      const x3 = snap(p2.x, d.x, eps);
      const y3 = x3 * k + c;
      p3 = new Vector2(x3, y3);
    }

    if (k !== 0) {
      const y3 = snap(p2.y, d.y, eps);
      const x3 = (y3 - c) / k;
      const p3t = new Vector2(x3, y3);
      if (p2.distanceTo(p3t) < p2.distanceTo(p3)) {
        p3 = p3t;
      }
    }
  } else {
    const y3 = snap(p2.y, d.y, eps);
    const x3 = p2.x;
    p3 = new Vector2(x3, y3);
  }
  return p3;
}

function grid(ctx: CanvasRenderingContext2D, p2: Vector2 | undefined) {
  ctx.reset();
  ctx.fillStyle = "#181818";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.scale(ctx.canvas.width / GRID_COLS, ctx.canvas.height / GRID_ROWS);
  ctx.lineWidth = 0.02;

  ctx.strokeStyle = "#303030";
  for (let x = 0; x <= GRID_COLS; ++x) {
    strokeLine(ctx, new Vector2(x, 0), new Vector2(x, GRID_COLS));
  }

  for (let y = 0; y <= GRID_ROWS; ++y) {
    strokeLine(ctx, new Vector2(0, y), new Vector2(GRID_ROWS, y));
  }

  let p1 = new Vector2(GRID_COLS * 0.43, GRID_ROWS * 0.4);
  ctx.fillStyle = "magenta";
  fillCircle(ctx, p1, 0.2);
  if (p2 !== undefined) {
    for (let i = 0; i < 5; ++i) {
      fillCircle(ctx, p2, 0.2);
      ctx.strokeStyle = "magenta";
      strokeLine(ctx, p1, p2);

      const p3 = rayStep(p1, p2);
      p1 = p2;
      p2 = p3;
    }
  }
}

(() => {
  const game = document.getElementById("game") as HTMLCanvasElement | null;
  if (game === null) {
    throw new Error("No canvas with id 'game' is found");
  }
  const ctx = game.getContext("2d");
  game.width = 800;
  game.height = 800;
  if (ctx === null) {
    throw new Error("2d context is not supported ");
  }

  let p2: Vector2 | undefined = undefined;
  game.addEventListener("mousemove", (event) => {
    p2 = new Vector2(event.offsetX, event.offsetY)
      .div(canvasSize(ctx))
      .mul(new Vector2(GRID_ROWS, GRID_COLS));
    grid(ctx, p2);
  });
  grid(ctx, p2);
})();
