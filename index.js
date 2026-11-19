"use strict";
const EPS = 1e-6;
const NEAR_CLIPPING_PLANE = 0.1;
const FAR_CLIPPING_PLANE = 20.0;
const FOV = Math.PI * 0.5;
const SCREEN_FACTOR = 20;
const SCREEN_WIDTH = Math.floor(16 * SCREEN_FACTOR);
const SCREEN_HEIGHT = Math.floor(9 * SCREEN_FACTOR);
const PLAYER_STEP_LEN = 0.5;
const PLAYER_SPEED = 2.0;
const PLAYER_SIZE = 0.5;
class RGBA {
    r;
    g;
    b;
    a;
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    static red() {
        return new RGBA(1, 0, 0, 1);
    }
    static blue() {
        return new RGBA(0, 0, 1, 1);
    }
    static green() {
        return new RGBA(0, 1, 0, 1);
    }
    static yellow() {
        return new RGBA(1, 1, 0, 1);
    }
    static purple() {
        return new RGBA(1, 0, 1, 1);
    }
    static cyan() {
        return new RGBA(0, 1, 1, 1);
    }
    brightness(factor) {
        return new RGBA(factor * this.r, factor * this.g, factor * this.b, this.a);
    }
    toStyle() {
        return `rgba(${Math.floor(this.r * 255)},${Math.floor(this.g * 255)},${Math.floor(this.b * 255)},${this.a})`;
    }
}
class Vector2 {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static zero() {
        return new Vector2(0, 0);
    }
    static scalar(value) {
        return new Vector2(value, value);
    }
    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }
    add(that) {
        return new Vector2(this.x + that.x, this.y + that.y);
    }
    sub(that) {
        return new Vector2(this.x - that.x, this.y - that.y);
    }
    scale(option) {
        return new Vector2(this.x * option, this.y * option);
    }
    div(that) {
        return new Vector2(this.x / that.x, this.y / that.y);
    }
    mul(that) {
        return new Vector2(this.x * that.x, this.y * that.y);
    }
    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    sqrLength() {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }
    norm() {
        const l = this.length();
        if (l === 0)
            return new Vector2(0, 0);
        return new Vector2(this.x / l, this.y / l);
    }
    sqrDistanceTo(that) {
        return that.sub(this).sqrLength();
    }
    lerp(that, t) {
        return that.sub(this).scale(t).add(this);
    }
    dot(that) {
        return this.x * that.x + this.y * that.y;
    }
    array() {
        return [this.x, this.y];
    }
    map(f) {
        return new Vector2(f(this.x), f(this.y));
    }
    rot90() {
        return new Vector2(-this.y, this.x);
    }
}
class Player {
    position;
    direction;
    constructor(position, direction) {
        this.position = position;
        this.direction = direction;
    }
    fovRange() {
        const l = Math.tan(FOV * 0.5) * NEAR_CLIPPING_PLANE;
        const p = this.position.add(Vector2.fromAngle(this.direction).scale(NEAR_CLIPPING_PLANE));
        const p1 = p.sub(p.sub(this.position).rot90().norm().scale(l));
        const p2 = p.add(p.sub(this.position).rot90().norm().scale(l));
        return [p1, p2];
    }
}
function canvasSize(ctx) {
    return new Vector2(ctx.canvas.width, ctx.canvas.height);
}
function fillCircle(ctx, p1, radius) {
    ctx.beginPath();
    ctx.arc(...p1.array(), radius, 0, 2 * Math.PI);
    ctx.fill();
}
function strokeLine(ctx, p1, p2) {
    ctx.beginPath();
    ctx.moveTo(...p1.array());
    ctx.lineTo(...p2.array());
    ctx.stroke();
}
function snap(x, dx) {
    if (dx > 0)
        return Math.ceil(x + EPS);
    if (dx < 0)
        return Math.floor(x - EPS);
    return x;
}
function hittingCell(p1, p2) {
    const d = p2.sub(p1);
    return new Vector2(Math.floor(p2.x + Math.sign(d.x) * EPS), Math.floor(p2.y + Math.sign(d.y) * EPS));
}
function rayStep(p1, p2) {
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
            if (p2.sqrDistanceTo(p3t) < p2.sqrDistanceTo(p3)) {
                p3 = p3t;
            }
        }
    }
    else {
        const y3 = snap(p2.y, d.y);
        const x3 = p2.x;
        p3 = new Vector2(x3, y3);
    }
    return p3;
}
class Scene {
    cells;
    width;
    height;
    color1;
    color2;
    constructor(cells) {
        this.color1 = new RGBA(0.094, 0.094, 0.094, 1);
        this.color2 = new RGBA(0.188, 0.188, 0.188, 1);
        this.height = cells.length;
        this.width = Number.MIN_VALUE;
        for (let row of cells) {
            this.width = Math.max(row.length, this.width);
        }
        this.cells = [];
        for (let row of cells) {
            this.cells = this.cells.concat(row);
            for (let i = 0; i < this.width - row.length; ++i) {
                this.cells.push(null);
            }
        }
    }
    size() {
        return new Vector2(this.width, this.height);
    }
    contains(p) {
        return 0 <= p.x && p.x < this.width && 0 <= p.y && p.y < this.height;
    }
    getWall(p) {
        if (!this.contains(p))
            return undefined;
        const fp = p.map(Math.floor);
        return this.cells[fp.y * this.width + fp.x];
    }
    isWall(p) {
        const c = this.getWall(p);
        return c !== null && c !== undefined;
    }
    getFloor(p) {
        const t = p.map(Math.floor);
        if ((t.x + t.y) % 2 === 0) {
            return this.color1;
        }
        else {
            return this.color2;
        }
    }
}
function castRay(scene, p1, p2) {
    let start = p1;
    while (start.sqrDistanceTo(p1) < FAR_CLIPPING_PLANE * FAR_CLIPPING_PLANE) {
        const c = hittingCell(p1, p2);
        if (scene.getWall(c) !== undefined && scene.getWall(c) !== null)
            break;
        const p3 = rayStep(p1, p2);
        p1 = p2;
        p2 = p3;
    }
    return p2;
}
function renderMinimap(ctx, player, position, size, scene) {
    ctx.save();
    const gridSize = scene.size();
    ctx.translate(...position.array());
    ctx.scale(...size.div(gridSize).array());
    ctx.lineWidth = 0.1;
    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, ...gridSize.array());
    for (let y = 0; y < gridSize.y; ++y) {
        for (let x = 0; x < gridSize.x; ++x) {
            const cell = scene.getWall(new Vector2(x, y));
            if (cell instanceof RGBA) {
                ctx.fillStyle = cell.toStyle();
                ctx.fillRect(x, y, 1, 1);
            }
            else if (cell instanceof HTMLImageElement) {
                ctx.drawImage(cell, x, y, 1, 1);
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
    // fillCircle(ctx, player.position, 0.2);
    ctx.fillRect(player.position.x - PLAYER_SIZE * 0.5, player.position.y - PLAYER_SIZE * 0.5, PLAYER_SIZE, PLAYER_SIZE);
    const [p1, p2] = player.fovRange();
    ctx.strokeStyle = "magenta";
    strokeLine(ctx, p1, p2);
    strokeLine(ctx, player.position, p1);
    strokeLine(ctx, player.position, p2);
    ctx.restore();
}
function renderFloor(ctx, player, scene) {
    ctx.save();
    ctx.scale(ctx.canvas.width / SCREEN_WIDTH, ctx.canvas.height / SCREEN_HEIGHT);
    const pz = SCREEN_HEIGHT / 2;
    const [p1, p2] = player.fovRange();
    const bp = p1.sub(player.position).length();
    for (let y = SCREEN_HEIGHT / 2; y < SCREEN_HEIGHT; ++y) {
        const sz = SCREEN_HEIGHT - y - 1;
        const ap = pz - sz;
        const b = ((bp / ap) * pz) / NEAR_CLIPPING_PLANE;
        const t1 = player.position.add(p1.sub(player.position).norm().scale(b));
        const t2 = player.position.add(p2.sub(player.position).norm().scale(b));
        for (let x = 0; x < SCREEN_WIDTH; ++x) {
            const t = t1.lerp(t2, x / SCREEN_WIDTH);
            const tile = scene.getFloor(t);
            if (tile instanceof RGBA) {
                ctx.fillStyle = tile.toStyle();
                ctx.fillRect(x, y, 1, 1);
            }
            else if (tile instanceof HTMLImageElement) {
                const c = t.map((x) => x - Math.floor(x));
                ctx.drawImage(tile, Math.floor(c.x * tile.width), Math.floor(c.y * tile.height), 1, 1, x, y, 1, 1);
            }
        }
    }
    ctx.restore();
}
function renderWalls(ctx, player, scene) {
    ctx.save();
    ctx.scale(ctx.canvas.width / SCREEN_WIDTH, ctx.canvas.height / SCREEN_HEIGHT);
    const [r1, r2] = player.fovRange();
    for (let x = 0; x < SCREEN_WIDTH; ++x) {
        const p = castRay(scene, player.position, r1.lerp(r2, x / SCREEN_WIDTH));
        const c = hittingCell(player.position, p);
        const cell = scene.getWall(c);
        if (cell instanceof RGBA) {
            const v = p.sub(player.position);
            const d = Vector2.fromAngle(player.direction);
            const stripHeight = SCREEN_HEIGHT / v.dot(d);
            ctx.fillStyle = cell.brightness(1 / v.dot(d)).toStyle();
            ctx.fillRect(Math.floor(x), Math.floor((SCREEN_HEIGHT - stripHeight) * 0.5), Math.ceil(1), Math.ceil(stripHeight));
        }
        else if (cell instanceof HTMLImageElement) {
            const v = p.sub(player.position);
            const d = Vector2.fromAngle(player.direction);
            const stripHeight = SCREEN_HEIGHT / v.dot(d);
            const t = p.sub(c);
            let u = 0;
            if ((Math.abs(t.x) < EPS || Math.abs(t.x - 1) < EPS) && t.y > 0) {
                u = t.y;
            }
            else {
                u = t.x;
            }
            ctx.drawImage(cell, Math.floor(u * cell.width), 0, 1, cell.height, Math.floor(x), Math.floor((SCREEN_HEIGHT - stripHeight) * 0.5), Math.ceil(1), Math.ceil(stripHeight));
            ctx.fillStyle = new RGBA(0, 0, 0, 1 - 1 / v.dot(d)).toStyle();
            ctx.fillRect(Math.floor(x), Math.floor((SCREEN_HEIGHT - stripHeight) * 0.5), Math.ceil(1), Math.ceil(stripHeight));
        }
    }
    ctx.restore();
}
function renderGame(ctx, player, scene) {
    const minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.03));
    const cellSize = ctx.canvas.width * 0.03;
    const minimapSize = scene.size().scale(cellSize);
    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "hsla(0,100%,9%,1.0)";
    ctx.fillRect(0, ctx.canvas.height * 0.5, ctx.canvas.width, ctx.canvas.height * 0.5);
    renderFloor(ctx, player, scene);
    renderWalls(ctx, player, scene);
    renderMinimap(ctx, player, minimapPosition, minimapSize, scene);
}
async function loadImageData(url) {
    const image = new Image();
    image.src = url;
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}
function canPlayerGoThere(scene, newPosition) {
    // TODO : Try cercle boudnry instead of a box
    const corner = newPosition.sub(Vector2.scalar(PLAYER_SIZE * 0.5));
    for (let dx = 0; dx < 2; ++dx) {
        for (let dy = 0; dy < 2; ++dy) {
            if (scene.isWall(corner.add(new Vector2(dx, dy).scale(PLAYER_SIZE)))) {
                return false;
            }
        }
    }
    return true;
}
(async () => {
    const game = document.getElementById("game");
    if (game === null)
        throw new Error("No canvas with id 'game' is found");
    const ctx = game.getContext("2d");
    const factor = 80;
    game.width = 16 * factor;
    game.height = 9 * factor;
    if (ctx === null)
        throw new Error("2d context is not supported ");
    const wall1 = await loadImageData("assets/images/wezu_tex_cc_by/wall1_color.png").catch(() => RGBA.purple());
    const wall2 = await loadImageData("assets/images/wezu_tex_cc_by/wall2_color.png").catch(() => RGBA.purple());
    const wall3 = await loadImageData("assets/images/wezu_tex_cc_by/wall3_color.png").catch(() => RGBA.purple());
    const scene = new Scene([
        [null, null, wall2, wall2, null, null, null, null, null],
        [null, null, null, wall3, null, null, null, null, null],
        [null, wall1, wall2, wall2, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, wall3, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
    ]);
    const player = new Player(scene.size().mul(new Vector2(0.7, 0.63)), Math.PI * 1.25);
    let movingForword = false;
    let movingBackword = false;
    let turningLeft = false;
    let turningRight = false;
    window.addEventListener("keydown", (e) => {
        if (!e.repeat) {
            switch (e.code) {
                case "KeyW":
                    movingForword = true;
                    break;
                case "KeyS":
                    movingBackword = true;
                    break;
                case "KeyA":
                    turningLeft = true;
                    break;
                case "KeyD":
                    turningRight = true;
                    break;
            }
        }
    });
    window.addEventListener("keyup", (e) => {
        if (!e.repeat) {
            switch (e.code) {
                case "KeyW":
                    movingForword = false;
                    break;
                case "KeyS":
                    movingBackword = false;
                    break;
                case "KeyA":
                    turningLeft = false;
                    break;
                case "KeyD":
                    turningRight = false;
                    break;
            }
        }
    });
    let prevTimestamp = 0;
    const frame = (timestamp) => {
        const deltaTime = (timestamp - prevTimestamp) / 1000;
        prevTimestamp = timestamp;
        let velocity = Vector2.zero();
        let angular_velocity = 0.0;
        if (movingForword) {
            velocity = velocity.add(Vector2.fromAngle(player.direction).scale(PLAYER_SPEED));
        }
        if (movingBackword) {
            velocity = velocity.sub(Vector2.fromAngle(player.direction).scale(PLAYER_SPEED));
        }
        if (turningLeft) {
            angular_velocity -= Math.PI;
        }
        if (turningRight) {
            angular_velocity += Math.PI;
        }
        player.direction += angular_velocity * deltaTime;
        const nx = player.position.x + velocity.x * deltaTime;
        if (canPlayerGoThere(scene, new Vector2(nx, player.position.y)))
            player.position.x = nx;
        const ny = player.position.y + velocity.y * deltaTime;
        if (canPlayerGoThere(scene, new Vector2(player.position.x, ny)))
            player.position.y = ny;
        renderGame(ctx, player, scene);
        window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame((timestamp) => {
        prevTimestamp = timestamp;
        window.requestAnimationFrame(frame);
    });
})();
// TODO : trying lighting with normal maps that come with some of the assests
//# sourceMappingURL=index.js.map