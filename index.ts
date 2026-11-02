const GRID_ROWS = 10;
const GRID_COLS = 10;

class Vector2 {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
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

  const cell_width = ctx.canvas.width / GRID_COLS;
  const cell_height = ctx.canvas.height / GRID_ROWS;

  ctx.strokeStyle = "#303030";
  for (let x = 0; x <= GRID_COLS; ++x) {
    ctx.moveTo(x * cell_width, 0);
    ctx.lineTo(x * cell_width, ctx.canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= GRID_ROWS; ++y) {
    ctx.moveTo(0, y * cell_height);
    ctx.lineTo(ctx.canvas.width, y * cell_height);
    ctx.stroke();
  }
})();
