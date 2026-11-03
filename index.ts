const GRID_ROWS = 10;
const GRID_COLS = 10;

class Vector2 {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  array(): [number, number] {
    return [this.x, this.y];
  }
}

function fillCircle(
  ctx: CanvasRenderingContext2D,
  p1: Vector2,
  radius: number,
) {
  ctx.beginPath();
  ctx.arc(...p1.array(), 0.2, radius, 2 * Math.PI);
  ctx.fill();
}

function strokeLine(ctx: CanvasRenderingContext2D, p1: Vector2, p2: Vector2) {
  ctx.beginPath();
  ctx.moveTo(...p1.array());
  ctx.lineTo(...p2.array());
  ctx.stroke();
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

  const p1 = new Vector2(GRID_COLS * 0.43, GRID_ROWS * 0.4);
  const p2 = new Vector2(GRID_COLS * 0.6, GRID_ROWS * 0.54);
  ctx.fillStyle = "magenta";
  fillCircle(ctx, p1, 0.2);
  fillCircle(ctx, p2, 0.2);
  ctx.strokeStyle = "magenta";
  strokeLine(ctx, p1, p2);
})();
