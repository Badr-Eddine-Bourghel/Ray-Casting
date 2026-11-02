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
  console.log(ctx);
})();
