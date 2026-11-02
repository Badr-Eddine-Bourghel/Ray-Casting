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
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GRID_COLS);
    ctx.stroke();
  }

  for (let y = 0; y <= GRID_ROWS; ++y) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GRID_ROWS, y);
    ctx.stroke();
  }

  const p1 = new Vector2(GRID_COLS * 0.5, GRID_ROWS * 0.5);
  ctx.fillStyle = "magenta";
  ctx.beginPath();
  ctx.arc(...p1.array(), 0.2, 0, 2 * Math.PI);
  ctx.fill();
})();
