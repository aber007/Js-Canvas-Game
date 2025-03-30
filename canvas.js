console.log("canvas.js loaded");
let canvas = document.querySelector("canvas");

import { Player } from "./player.js";
import { Upgrades } from "./upgrades.js";
import { Block, CannonBall, Enemy, Enemy2} from "./objects.js";
import { displayInterractButton, displayTextBox, displayTextBoxSeries } from "./text_functions.js";
import { ProcedualGeneration} from "./editor.js";

canvas.width = 1536;
canvas.height = 768;

let edit_mode = false;

var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

function showLoadingScreen() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Loading...", canvas.width / 2 - 50, canvas.height / 2);
}
showLoadingScreen();

class Grid {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.relativex = x;
        this.width = 32 * 4;
        this.height = 32 * 4;
        this.coord = [Math.floor(y / 32 / 4), Math.floor(x / 32 / 4)];
        this.color = color;
        this.collidable = false;
        this.walkable = false;
        this.img = new Image();
        this.img2 = new Image();
        this.back_img = new Image();
        this.type = undefined;
        this.img.src = "";
        this.img2.src = "";
        this.back_img.src = "";

        this.outline = "none";
        this.draw();
    }

    draw(offset = 0) {
        if (this.img.src) {
            if (this.img2.src != "") {
                ctx.drawImage(
                    this.img2,
                    this.x + offset,
                    this.y,
                    this.width,
                    this.height
                );
            }
            if (this.img.src.includes(".png")) {
                ctx.drawImage(
                    this.img,
                    this.x + offset + 32 * 4,
                    canvas.height / 2 + canvas.height / 6,
                    this.width * 2,
                    this.height * 3.5
                );
            } else {
                ctx.drawImage(
                    this.img,
                    this.x + offset,
                    this.y,
                    this.width,
                    this.height
                );
            }
            // Draw the outline
            if (this.outline != "none") {
                ctx.beginPath();
                ctx.rect(this.x + offset, this.y, this.width, this.height);
                ctx.strokeStyle = this.outline;
                ctx.stroke();
                ctx.closePath();
            }
        } else {
            // Do northing
        }
    }
}

// Edit mode
let savefile = {};
function unload() {
    // Clear the canvas section and redraw the default grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    savefile = {}; // Clear the savefile object
    // Clear the  this.grids array
    grids = [];
    for (let j = 0; j < 8; j++) {
        // Rows
        let row = []; // Create a new row
        for (let i = 0; i < 12; i++) {
            // Columns
            let x = i * 32 * 4;
            let y = j * 32 * 4;
            row.push(new Grid(x, y, "lightblue")); // Add each Grid to the current row
        }
        grids.push(row); // Add the row to the grids array
    }
}

function load(texture_nr = null, offset = 0) {
    if (texture_nr !== null) {
        // Automatically load the specified texture file
        let fileName = `img/textures/texture${texture_nr}.json`;

        // Use fetch or an equivalent method to load the JSON file
        fetch(fileName)
            .then((response) => {
                if (!response.ok)
                    throw new Error(`Failed to load file: ${fileName}`);
                return response.json();
            })
            .then((data) => {
                applyTextureData(data, offset); // Apply the loaded texture data to the grid
                console.log(`Successfully loaded ${fileName}`);
            })
            .catch((err) => {
                console.log(`Error: ${err}`);
            });
    } else {
        // Allow the user to select a file manually
        let input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.onchange = (e) => {
            let file = e.target.files[0];
            let reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
                try {
                    let data = JSON.parse(reader.result);
                    applyTextureData(data, offset); // Apply the loaded texture data to the grid
                    console.log(`Successfully loaded file: ${file.name}`);
                } catch (err) {
                    alert("Failed to load file: " + err.message);
                }
            };
        };
        input.click();
    }
}

// Helper function to apply the loaded data to the grid
function applyTextureData(data, offset) {
    for (let key in data) {
        let [row, col] = key.split(",").map(Number); // Parse grid coordinates
        let grid = game.grids[row][col + offset];
        if (grid) {
            grid.img.src = data[key].img || "";
            grid.img.onload = () => grid.draw();
            grid.img2.src = data[key].img2 || "";
            grid.collidable = data[key].collidable || false;
            grid.walkable = data[key].walkable || false;
            grid.type = "grass";

            if (
                data[key].walkable &&
                grid.img.src.includes(".gif") &&
                grid.x > canvas.width / 2
            ) {
                // Chance to add a block at that row
                if (Math.random() < 0.15) {
                    // Decide color of block (value)
                    let color = "gray";
                    let texture = "img/coins/coin_gray.gif";
                    const value = Math.random();
                    if (value < 0.05) {
                        color = "blue";
                        texture = "img/coins/coin_blue.gif";
                    } else if (value < 0.3) {
                        color = "yellow";
                        texture = "img/coins/coin_yellow.gif";
                    }
                    console.log("Grid: " + grid.coord + " is walkable");
                    // add outline
                    game.blocks.push(
                        new Block(
                            grid.x - canvas.width / 2 + 48,
                            grid.y - 32,
                            32,
                            32,
                            color,
                            texture
                        )
                    );
                } else {
                    if(Math.random() < 0.2){
                        console.log("Enemy added");
                        console.log("Enemy position: " + grid.x + " " + grid.y);
                        game.collect_enemies.push(new Enemy2(
                            grid.x - canvas.width / 2 + 48,
                            grid.y - 32,
                            64,
                            64,
                            "red",
                            "img/enemy2/hedgehog_01.gif",
                            randomIntFromRange(1, 3)
                        ));
                    }
                }
            }
        } else {
            // Create a new grid if it doesn't exist
            let x = (col + offset) * 32 * 4;
            let y = row * 32 * 4;
            grid = new Grid(x, y, "lightblue");
            grid.coord = [row, col + offset];
            grid.img.src = data[key].img || "";
            grid.img.onload = () => grid.draw();
            grid.img2.src = data[key].img2 || "";
            grid.collidable = data[key].collidable || false;
            grid.walkable = data[key].walkable || true;
            grid.type = undefined;
            game.grids[row][col + offset] = grid;

            // Get longest row
            let longest_row = 0;
            for (let row of game.grids) {
                if (row.length > longest_row) {
                    longest_row = row.length;
                }
            }
            // Add new empty grids to rows that are shorter
            for (let row of game.grids) {
                while (row.length < longest_row) {
                    let x = row.length * 32 * 4;
                    let y = row[0].y;
                    let grid = new Grid(x, y, "lightblue");
                    row.push(grid);
                }
            }
        }
    }

    // Verify the grid coordinates
    for (let i = 0; i < game.grids.length; i++) {
        for (let j = 0; j < game.grids[i].length; j++) {
            // Check if type is Grid
            if (game.grids[i][j] instanceof Grid === false) {
                console.log(
                    "Invalid grid type at: ",
                    i,
                    j,
                    "Fixing broken grid"
                );
                let x = j * 32 * 4;
                let y = i * 32 * 4;
                let grid = new Grid(x, y, "lightblue");
                game.grids[i][j] = grid; // Replace with a new Grid instance
            }
        }
    }
    savefile = data; // Update the global savefile variable
}

function randomIntFromRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

class Cannon {
    constructor(game) {
        this.game = game;
        this.x = 32 * 8;
        this.y = canvas.height / 2;
        this.cannonBalls = [];
        this.ballSpeed = 25;
        this.ballSize = 20;

        this.cannonWheel = new Image();
        this.cannonWheel.src = "img/cannon/wheel.gif";
        this.cannon = new Image();
        this.img_nr = 1;
        this.cannon.src = `img/cannon/${this.img_nr}.gif`;

        this.cannonBallAngle = 0;
        this.centerX = 0;
        this.centerY = 0;
        this.angle = 1;
        this.updateAngle = true;

        this.specialCooldown = 0;
        this.specialMaxCooldown = 10;
        this.specialDamage = 2;
        this.specialType = "pierce";

        this.normalCooldown = 0;
        this.normalMaxCooldown = 1;
        this.normalDamage = 1;
    }

    draw(ctx, mouse) {
        const image_Width = this.cannon.width * 4;
        const image_Height = this.cannon.height * 4;

        this.centerX = this.x + image_Width / 4 - 64;
        this.centerY = this.y + image_Height / 2 + 32;

        if (this.updateAngle) {
            this.angle = Math.atan2(
                mouse.y - this.centerY,
                mouse.x - this.centerX
            );
        }

        // Draw the cannon base
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        ctx.drawImage(
            this.cannon,
            -image_Width / 4,
            -image_Height / 2 - (this.img_nr - 1) * 3,
            this.cannon.width * 4,
            this.cannon.height * 4
        );
        ctx.restore();

        ctx.drawImage(
            this.cannonWheel,
            this.x - 64,
            this.y + 64,
            this.cannonWheel.width * 4,
            this.cannonWheel.height * 4
        );
        // Draw the cannon ball
    }

    animateSpecial() {
        // Switch img to 2,3,4,5,6,7 every 0.1 seconds
        const specialAnimation = setInterval(() => {
            if (this.img_nr < 7) {
                this.img_nr += 1;
            } else {
                this.img_nr = 1;
                clearInterval(specialAnimation);
            }
            this.cannon.src = `img/cannon/${this.img_nr}.gif`;
        }, 100);
    }

    shoot(special) {
        if (special && this.specialCooldown > 0) {
            return;
        } else if (!special && this.normalCooldown > 0) {
            return;
        }
        if (special) {
            this.specialCooldown = this.specialMaxCooldown;
        } else {
            this.normalCooldown = this.normalMaxCooldown;
        }
        // Shoot the cannon

        this.cannonBallAngle = Math.atan2(
            game.mouse.y - this.y,
            game.mouse.x - this.x
        );
        const size = special ? this.ballSize * 4 : this.ballSize;

        let specialBall = "";
        if (special) {
            specialBall = this.specialType;
            this.animateSpecial();
        }

        // Get loactio of the tip of the cannon
        const tipX = this.centerX + Math.cos(this.angle) * 64;
        const tipY = this.centerY + Math.sin(this.angle) * 64;
        for (let i = 0; i < game.upgrades.multishotMultiplier(); i++) {
            console.log(game.upgrades.multishotMultiplier());
            this.cannonBalls.push(
                new CannonBall(
                    tipX,
                    tipY - size / 2,
                    size,
                    size,
                    this.cannonBallAngle + i * 0.1,
                    specialBall,
                    game.upgrades.multishotMultiplier() > 1 &&
                    specialBall === ""
                        ? randomIntFromRange(4, 7)
                        : 0
                )
            );
            if (specialBall != "") {
                break;
            }
        }
    }

    update() {
        this.cannon.src = `img/cannon/${this.img_nr}.gif`;
        // Update the cannon ball
        if (game.mouse.pressed) {
            this.shoot();
        }
        this.draw(ctx, game.mouse);
        for (let ball of this.cannonBalls) {
            ball.update();
        }
    }
}

class Game {
    constructor(grids) {
        this.towerDefense = false;
        this.useProcedualWorldCreation = true;

        /**
         * @type {Player}
         */
        this.player = new Player(canvas, ctx, this);
        this.cannon = new Cannon(this);
        this.grids = grids;
        this.lastFrameTime = 0; // Track the last frame timestamp
        this.fpsInterval = 1000 / 60; // Desired time per frame (60 FPS)
        this.currentFrame = 0;
        this.textureCooldown = false;

        this.procedual = new ProcedualGeneration(this.grids.length);
        this.leftx = this.player.x - canvas.width / 2;
        this.rightx = this.player.x + canvas.width / 2;
        this.pressed_keys = { a: false, d: false, space: false };
        this.currentTexturenr = 0;
        this.switchOnce = true;
        this.gameHasBeenSwitched = false;

        this.justStarted = true;
        this.cannonJustStarted = true;

        this.upgrades = new Upgrades(canvas, ctx);

        // Background images (10)
        this.bg1 = new Image();
        this.bg2 = new Image();
        this.bg3 = new Image();
        this.bg4 = new Image();
        this.bg5 = new Image();
        this.bg6 = new Image();
        this.bg7 = new Image();
        this.bg8 = new Image();
        this.bg9 = new Image();
        this.bg10 = new Image();

        this.bg1.src = "img/background/bg1.png";
        this.bg2.src = "img/background/bg2.png";
        this.bg3.src = "img/background/bg3.png";
        this.bg4.src = "img/background/bg4.png";
        this.bg5.src = "img/background/bg5.png";
        this.bg6.src = "img/background/bg6.png";
        this.bg7.src = "img/background/bg7.png";
        this.bg8.src = "img/background/bg8.png";
        this.bg9.src = "img/background/bg9.png";
        this.bg10.src = "img/background/bg10.png";

        this.bg11 = new Image();
        this.bg11.src = "img/background/creature.png";
        this.npc = new Image();
        this.npc.src = "img/person.gif";
        this.maybeHat = false;

        this.hud = new Image();
        this.hud.src = "img/background/topbar.png";

        this.tower = new Image();
        this.tower.src = "img/tower.png";

        // Game parameters
        this.gravity = 0.5;
        this.friction = 0.9;
        this.airResistance = 0.99;
        this.ropeElasticity = 0.1;

        // Collect settings
        this.weight = 0;
        this.weightMultiplier = 1;
        this.inventory = [];
        this.collect_enemies = [];

        this.upgradeShopVisible = false;
        this.maxTimer = 120 * 60; //Seconds times framerate
        this.timer = 0;
        this.weather = 0;

        this.rainDrops = [];
        this.maxRainDrops = 100;
        this.allowLightning = false;

        // Img settints
        this.img_scale = 6;

        // Game state
        this.blocks = [];
        this.mouse = { x: 0, y: 0, pressed: false };

        // Tower defence related
        this.enemies = [];
        this.round = 0;
        this.playerReady = false;
        this.health = 10;
        this.maxHealth = 10;
        this.yellow = 10;
        this.gray = 10;
        this.blue = 10;
    }

    showInterractable() {
        // Draw a small "E" above the player to indicate that the player can interact with something
        displayInterractButton("E");
    }

    getRandomTexture() {
        while (true) {
            const random = randomIntFromRange(1, 9);
            if (random != this.currentTexturenr) {
                this.currentTexturenr = random;
                return random;
            }
        }
    }

    infinitewalk() {
        // Get the rightmost and leftmost grid
        let rightmost = this.grids[0][this.grids[0].length - 1].x;
        if (
            this.rightx >= rightmost &&
            this.player.movement_direction == 1 &&
            this.textureCooldown == false
        ) {
            this.textureCooldown = true;
            // Load new grid texture
            if (this.useProcedualWorldCreation) {
                let procedualTile = this.procedual.newTile(this.procedual.yPos);
                applyTextureData(procedualTile, this.grids[0].length);
                // updateAllGrids(this.grids)
            } else {
                load(this.getRandomTexture(), this.grids[0].length);
            }
        } else {
            if ((this.timer / 60) % 1 == 0) {
                this.textureCooldown = false;
            }
        }
    }

    doAnimations() {
        // Do animations
        if (this.player.movement_direction != 0 && this.player.onGround) {
            this.player.img_nr += 1;
            if (this.player.img_nr > 4) {
                this.player.img_nr = 1;
            }
        }
    }

    dropLastBlock() {
        // Drop the last block in the inventory
        if (this.inventory.length > 0) {
            this.inventory.pop();
            this.weight -= 1;
        }
    }

    updatePosition(update) {
        if (update > 0 && this.player.rightCollision) {
            update = 0;
        } else if (update < 0 && this.player.leftCollision) {
            update = 0;
        }
        if (update > 0) {
            update -= this.weight / this.weightMultiplier;
            if (update < 0) {
                update = 0;
            }
        } else if (update < 0) {
            update += this.weight / this.weightMultiplier;
            if (update > 0) {
                update = 0;
            }
        }

        this.player.vx = update;
        this.leftx -= update;
        this.rightx -= update;
    }

    updatePlayerSpeed() {
        if (this.pressed_keys.d) {
            this.player.movement_direction = 1;
        } else if (this.pressed_keys.a) {
            this.player.movement_direction = -1;
        } else if (!this.pressed_keys.d && !this.pressed_keys.a) {
            this.player.movement_direction = 0;
        }

        if (this.player.movement_direction == 1) {
            if (this.player.playerOffset < 0) {
                this.player.playerOffset += this.player.move_speed;
            } else {
                this.updatePosition(-this.player.move_speed);
            }
        } else if (this.player.movement_direction == -1) {
            if (this.leftx < this.player.move_speed) {
                if (
                    this.player.playerOffset <=
                    -canvas.width / 2 + this.player.move_speed
                )
                    return;
                this.player.vx = 0;
                this.player.playerOffset -= this.player.move_speed;
            } else {
                this.updatePosition(this.player.move_speed);
            }
        } else {
            this.player.vx = 0;
        }
    }
    updateBackground() {
        const handleWeatherEvents = (event) => {
            let red = 0;
            let green = 0;
            let blue = 0;
            let front_red = 0;
            let front_green = 0;
            let front_blue = 0;
            let oppacity = 0.5;
            this.allowLightning = false;

            const drawRain = () => {
                ctx.strokeStyle = "rgba(174,194,224,0.5)";
                ctx.lineWidth = 1;
                ctx.lineCap = "round";
                for (let drop of this.rainDrops) {
                    ctx.beginPath();
                    ctx.moveTo(
                        drop.x + this.player.x - canvas.width / 2,
                        drop.y
                    );
                    ctx.lineTo(
                        drop.x + this.player.x - canvas.width / 2,
                        drop.y + drop.length
                    );
                    ctx.stroke();
                }
            };

            const updateRain = (maxRainDrops) => {
                while (this.rainDrops.length < maxRainDrops) {
                    this.rainDrops.push({
                        x: Math.random() * canvas.width * 2 - canvas.width / 2,
                        y: Math.random() * canvas.height,
                        length: Math.random() * 20,
                        speed: Math.random() * 5 + 10,
                    });
                }
                for (let drop of this.rainDrops) {
                    drop.y += drop.speed;
                    if (drop.y > canvas.height - 128) {
                        drop.y = -drop.length;
                        drop.x =
                            Math.random() * canvas.width * 2 -
                            canvas.width / 2 +
                            this.player.inverseX -
                            canvas.width / 2;
                    }
                }
            };

            const animateRain = (maxRainDrops) => {
                drawRain();
                updateRain(maxRainDrops);
            };

            if (event == 0) {
                // Normal
                red = Math.min(
                    150,
                    Math.floor((this.timer / this.maxTimer) * 255)
                );
                green = 80;
                blue = Math.max(
                    50,
                    Math.floor((1 - this.timer / this.maxTimer) * 255)
                );
                front_red = red;
                front_green = green;
                front_blue = blue;
                oppacity = Math.max(
                    0,
                    0.3 - (this.maxTimer / 1000 - this.timer / 1000) * 0.5
                );
            } else if (event == 1) {
                // Rain
                oppacity = 0.1;
                this.maxRainDrops = 300;
                animateRain(this.maxRainDrops);
            } else if (event == 2) {
                // Mist
                red = Math.min(
                    150,
                    Math.floor((this.timer / this.maxTimer) * 255)
                );
                green = 80;
                blue = Math.max(
                    50,
                    Math.floor((1 - this.timer / this.maxTimer) * 255)
                );
                front_red = 189;
                front_green = 177;
                front_blue = 194;

                red = Math.min(
                    150,
                    Math.floor((this.timer / this.maxTimer) * 255)
                );
                green = 80;
                blue = Math.max(
                    50,
                    Math.floor((1 - this.timer / this.maxTimer) * 255)
                );
                oppacity = 0.5;

                const gradient = ctx.createLinearGradient(
                    canvas.width / 2,
                    canvas.height / 2,
                    canvas.width / 2,
                    canvas.height
                );
                gradient.addColorStop(1, "rgba(225, 215, 229, 1)");
                gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = gradient;
                ctx.fillRect(
                    0,
                    canvas.height / 2,
                    canvas.width,
                    canvas.height / 2
                );
            } else if (event == 3) {
                // Thunder
                this.maxRainDrops = 900;
                animateRain(this.maxRainDrops);
                this.allowLightning = true;
            }
            // Background hue
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = `rgb(${red},${green},${blue})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;

            // Overlay hue
            const overlayhue = document.getElementById("overlayhue");
            const nightoverlay = document.getElementById("nightoverlay");
            overlayhue.style.backgroundColor = `rgb(${front_red},${front_green},${front_blue}, ${oppacity})`;
            if (this.timer <= 10 * 60) {
                nightoverlay.style.backgroundColor = `rgba(8,8,8,${
                    1 - this.timer / 600
                })`;
                // lower the saturation
            } else {
                nightoverlay.style.backgroundColor = `rgba(8,8,8,0)`;
            }
        };
        // Show the images in the bg folder as background and each move at different speed
        const bgImages = [
            this.bg1,
            this.bg2,
            this.bg3,
            this.bg4,
            this.bg5,
            this.bg6,
            this.bg7,
            this.bg8,
            this.bg9,
            this.bg10,
        ];
        const speeds = [1024, 512, 256, 128, 64, 32, 16, 8, 4, 2];

        let doLightning = false;
        const lightningX = randomIntFromRange(0, canvas.width - 256);
        const lightningY = 0;
        const lightningWidth = randomIntFromRange(500, 700);
        const lightningHeight = canvas.height;
        if (this.allowLightning && randomIntFromRange(1, 400) === 1) {
            doLightning = true;
            // Set location and size of lightning
        }

        for (let i = 0; i < bgImages.length; i++) {
            let img = bgImages[i];
            let speed = speeds[i];
            let x = (this.player.x / speed) % img.width;

            // Show the creature
            if (
                i === 7 &&
                x < -156 &&
                x > -555 &&
                (this.player.x > -5000 ||
                    (this.player.x < -16000 && this.player.x > -19000)) &&
                this.weather > 1
            ) {
                ctx.drawImage(
                    this.bg11,
                    x + 1500,
                    canvas.height / 2 + 160,
                    this.bg11.width,
                    this.bg11.height
                );
            }
            if (doLightning) {
                ctx.fillStyle = `rgba(255, 255, 255, ${1.4 - 0.2 * i})`;
                ctx.fillRect(
                    lightningX,
                    lightningY,
                    lightningWidth,
                    lightningHeight
                );
            }

            // Draw the image multiple times to cover the entire canvas width
            for (let j = -1; j <= canvas.width / img.width + 1; j++) {
                ctx.drawImage(
                    img,
                    x + j * img.width,
                    -img.height,
                    img.width * 2,
                    img.height * 2
                );
            }
        }
        handleWeatherEvents(this.weather);
    }

    displayCastle() {
        // Draw black background behind castle
        ctx.fillStyle = "black";
        ctx.fillRect(
            this.player.x - canvas.width / 2 + 15,
            -32,
            this.tower.width * 5,
            this.tower.height * 6
        );

        // Display the castle
        ctx.drawImage(
            this.tower,
            this.player.x - canvas.width / 2 + 15,
            -32,
            this.tower.width * 6,
            this.tower.height * 6
        );
        // Draw the npc
        ctx.save();
        ctx.translate(
            this.player.x - canvas.width / 4 + 100,
            canvas.height - 266
        );
        ctx.scale(-Math.sign((this.player.x - canvas.width / 4 + 100 - this.npc.width * 3) - (this.player.playerOffset) - canvas.width / 2), 1);
        ctx.drawImage(
            this.npc,
            -this.npc.width * 3,
            0,
            this.npc.width * 6,
            this.npc.height * 6
        );
        ctx.restore();
    }

    showHUD() {
        // Draw the HUD
        ctx.drawImage(this.hud, 0, 0, this.hud.width, this.hud.height);

        // Draw the hp bar
        const maxLength = 93;
        const healthLength = (this.health / this.maxHealth) * maxLength;
        ctx.fillStyle = "red";
        ctx.fillRect(73, 25, healthLength, 13);

        const inventoryLength =
            (this.weight / this.player.move_speed) * maxLength;
        ctx.fillStyle = "yellow";
        ctx.fillRect(287, 25, inventoryLength, 13);

        // Numbers of coins
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText(this.gray, 470, 40);
        ctx.fillText(this.yellow, 580, 40);
        ctx.fillText(this.blue, 690, 40);

        // Draw the timer
        const seconds = Math.floor(this.timer / 60);
        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        ctx.fillText(
            `${minutes}:${
                displaySeconds < 10 ? "0" + displaySeconds : displaySeconds
            }`,
            1000,
            40
        );
    }

    checkPassiveUpgrades() {
        this.upgrades.regenerateHealth(game);
    }

    updateCollect = () => {
        this.infinitewalk();
        this.checkPassiveUpgrades();

        // update timer
        if (this.player.playerOffset >= 0) {
            if (this.timer <= 0 && !this.timeoutSet) {
                displayTextBox(
                    "You got lost in the dark. A mysterious creature knocked you out and took all your coins.",
                    7000
                );
                this.timeoutSet = true;
                setTimeout(() => {
                    this.health -= 3;
                    this.timer = this.maxTimer;
                    this.switchOnce = false;
                    this.switchGame();
                    this.playerReady = true;
                    this.timeoutSet = false;
                }, 5000);
                // Restart the collect game
            } else if (this.timer > 0) {
                this.timer -= 1;
            }
        }

        // Clear and redraw only visible grids
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.updateBackground();
        for (let row of this.grids) {
            for (let grid of row) {
                try {
                    if (
                        grid.x + grid.width >
                            this.player.inverseX - canvas.width / 2 &&
                        grid.x < this.player.inverseX + canvas.width / 2
                    ) {
                        grid.draw(this.player.x - canvas.width / 2);
                    }
                } catch (e) {
                    console.log(e);
                    console.log(grid);
                    console.log(this.grids);
                    dispatchEvent("error", e);
                }
            }
        }

        for (const block of this.blocks) {
            block.draw(ctx);
        }
        for (const enemy of this.collect_enemies) {
            enemy.update();
        }
        // Update and draw the player
        this.displayCastle();
        this.player.update();
        this.showHUD();
        if (this.upgradeShopVisible) {
            this.upgrades.showUpgradeShop();
        }
        this.gameHasBeenSwitched = true;

        // console.log(this.player.x +" "+ this.player.inverseX + " " + this.player.playerOffset);
    };

    updateCannon = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw the cannon
        this.cannon.update();

        for (let row of this.grids) {
            for (let grid of row) {
                // Please ignore this line
                if (grid.x === 0 && grid.y === 640) {
                    grid.draw(this.player.x - canvas.width / 2);
                }
            }
        }

        // Update and draw the enemies
        for (let enemy of this.enemies) {
            enemy.update();
        }
        if (this.playerReady) {
            this.round += 1;
            this.gameHasBeenSwitched = true;
            // Spawn enemies
            this.playerReady = false;
            for (
                let i = 0;
                i < randomIntFromRange(1 * this.round, 3 * this.round);
                i++
            ) {
                this.enemies.push(
                    new Enemy(
                        canvas.width - 128,
                        canvas.height / 2,
                        32,
                        64,
                        this
                    )
                );
            }
        }

        // Show the HUD
        this.showHUD();

        // Switch game if no enemies are left
        if (this.enemies.length == 0) {
            this.switchGame();
        }
    };

    animateCannon = (timestamp) => {
        // Run the game logic only if enough time has passed
        const elapsed = timestamp - this.lastFrameTime;
        if (elapsed > this.fpsInterval) {
            this.lastFrameTime = timestamp;
            this.currentFrame++;
            if (this.cannon.specialCooldown > 0) {
                this.cannon.specialCooldown -= 1 / 60;
            }
            if (this.cannon.normalCooldown > 0) {
                this.cannon.normalCooldown -= 1 / 60;
            }
            if (this.currentFrame > 20) {
                // 20 frames per animation
                this.currentFrame = 0;
                this.doAnimations();
            }

            // Update game logic
            this.updateCannon();
        }

        // Request the next frame
        if (this.towerDefense) {
            requestAnimationFrame(this.animateCannon);
        } else {
            requestAnimationFrame(this.animateCollect);
        }
    };

    animateCollect = (timestamp) => {
        const elapsed = timestamp - this.lastFrameTime;

        // Run the game logic only if enough time has passed
        if (elapsed > this.fpsInterval) {
            this.lastFrameTime = timestamp;
            this.currentFrame++;
            if (this.currentFrame > 20) {
                // 20 frames per animation
                this.currentFrame = 0;
                this.doAnimations();
            }

            // Update game logic
            this.updateCollect();
        }

        // Request the next frame
        if (this.towerDefense) {
            requestAnimationFrame(this.animateCannon);
        } else {
            requestAnimationFrame(this.animateCollect);
        }
    };

    switchGame() {
        console.log("Switching game");
        const nightoverlay = document.getElementById("nightoverlay");
        nightoverlay.style.backgroundColor = `rgba(8,8,8,0)`;
        this.player.x = canvas.width / 2;
        this.player.inverseX = canvas.width / 2;
        this.player.y = canvas.height - 400;
        this.player.playerOffset = -600;
        this.player.playery = 0;

        if (game.gameHasBeenSwitched) {
            game.gameHasBeenSwitched = false;
            if (this.towerDefense) {
                this.enemies = [];
                this.playCollect();
            } else {
                this.playCannon();
            }
        }
    }

    removeListeners() {
        removeEventListener("keydown", this.keydownListener);
        removeEventListener("keyup", this.keyupListener);
        removeEventListener("mousemove", this.mousemoveListener);
        removeEventListener("mousedown", this.mousedownListener);
        removeEventListener("mouseup", this.mouseupListener);
        removeEventListener("contextmenu", this.contextmenuListener);
    }

    // Initializer for the cannon game
    playCannon() {
        canvas.style.backgroundColor = "darkslategray";
        showLoadingScreen();
        unload();
        this.removeListeners();
        this.x = canvas.width / 2;
        
        // Remove overlays
        const overlayhue = document.getElementById("overlayhue");
        overlayhue.style.backgroundColor = `rgba(0,0,0,0)`;
        const nightoverlay = document.getElementById("nightoverlay");
        nightoverlay.style.backgroundColor = `rgba(8,8,8,0)`;
        ctx.globalAlpha = 0;
        ctx.fillStyle = `rgb(${0},${0},${0})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        
        this.blocks = [];
        this.towerDefense = true;
        
        // Define event listeners
        this.mousemoveListener = (event) => {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        };
        this.mousedownListener = (e) => {
            if (e.button == 0) {
                this.mouse.pressed = true;
            } else if (e.button == 2 && this.cannon.specialCooldown <= 0) {
                this.cannon.img_nr = 2;
            }
        };
        this.mouseupListener = (e) => {
            if (e.button == 0) {
                this.mouse.pressed = false;
            }
        };
        this.contextmenuListener = (e) => {
            e.preventDefault();
            this.cannon.shoot(true);
        };
        
        // Add event listeners
        addEventListener("mousemove", this.mousemoveListener);
        addEventListener("mousedown", this.mousedownListener);
        addEventListener("mouseup", this.mouseupListener);
        addEventListener("contextmenu", this.contextmenuListener);
        
        load(-1);
        if (this.cannonJustStarted) {
            this.cannonJustStarted = false;
            displayTextBox(
                "Use the mouse to aim and left click or hold to shoot. Right click to use your special cannonball. \n\n Press E to close."
            );
        }
    }

    playCollect() {
        canvas.style.backgroundColor = "black";
        unload();
        showLoadingScreen();
        this.weather = randomIntFromRange(0, 3);
        this.timer = this.maxTimer;
        this.removeListeners();
        this.towerDefense = false;

        const introTexts = [
            "Ah, you're finally awake. \n\nPress 'E' to continue. \nPress 'ESC' to skip the tutorial.",
            "I've waited for someone to get trapped here. \n\nPress 'E' to continue.",
            "...",
            "Well, I guess you're stuck here now. Might as well start decorating, you're gonna be here a while.",
            "But don't worry, I might help you out.",
            "You just need to defend this castle for me.",
            "Interact with the door to defend a wave of enemies.",
            "Good luck.",
            "Hold on, I almost forgot.",
            "You should probably collect some coins first.",
            "You'll need them for upgrades. Or a nice coffin. Up to you.",
            "Talk to me later if you want to buy upgrades.",
            "Walk to the right using W, A, S, D and 'space' to collect coins.",
            "You will automatically collect coins, but they are heavy so be careful with how many you carry.",
            "If you feel like you carry too much, press 'Q' to drop the last coin. Because nothing screams survival like abandoning wealth.",
            "You need to come back here to acquire the coins.",
            "Just make sure to come back before nighttime. Otherwise, the strange creature will take you and your coins.",
            "Just kidding, you might be fine. Probably... The last guy was *mostly* fine. Well, the parts I found were.",
            "Well, good luck. \n\nPress 'E' to continue.",
        ];
        if (this.justStarted) {
            this.justStarted = false;
            // displayTextBoxSeries(introTexts);
        }

        // Define event listeners
        this.keydownListener = (e) => {
            if (e.key.toLowerCase() == "d") {
                this.pressed_keys.d = true;
                this.player.rightCollision = false;
            }
            if (e.key.toLowerCase() == "a") {
                this.pressed_keys.a = true;
                this.player.leftCollision = false;
            }
            if (e.key == " " || e.key == "Spacebar") {
                this.pressed_keys.space = true;
                this.player.jump();
            }
            if (e.key.toLowerCase() == "q") {
                this.dropLastBlock();
            }
            if (e.key.toLowerCase() == "e") {
                if (
                    this.canSwitch &&
                    this.switchOnce &&
                    !this.towerDefense
                ) {
                    this.switchOnce = false;
                    this.switchGame();
                    this.playerReady = true;
                } else if (this.canBuy){
                    this.upgrades.showUpgradeShop(this);
                }
            }
        };
        this.keyupListener = (e) => {
            if (e.key.toLowerCase() == "d") {
                this.pressed_keys.d = false;
                this.player.rightCollision = false;
            }
            if (e.key.toLowerCase() == "a") {
                this.pressed_keys.a = false;
                this.player.leftCollision = false;
            }
            if (e.key == " " || e.key == "Spacebar") {
                this.pressed_keys.space = false;
            }
            if (e.key.toLowerCase() == "e") {
                this.switchOnce = true;
            }
        };

        // Add event listeners
        addEventListener("keydown", this.keydownListener);
        addEventListener("keyup", this.keyupListener);

        // Start the animation loop
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.animateCollect);
        load(0);
        if (this.useProcedualWorldCreation) {
            for (let i = 0; i < 20; i++) {
                console.log(
                    "Creating procedual world: " + (i / 20) * 100 + "%"
                );
                let procedualTile = this.procedual.newTile(this.procedual.yPos);
                applyTextureData(procedualTile, this.grids[0].length);
            }
            console.log("Creating procedual world: " + 1 * 100 + "%");
        }
        let endtime = performance.now();
        console.log(
          `Time taken to load: ${(
              (endtime - startime) /
              1000
          ).toPrecision(6)} seconds`
      );
    }
}
// Preload function
const startime = performance.now();
const preloadImages = (imagePaths) => {
    return Promise.all(
        imagePaths.map((path) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = path;
                img.onload = () => resolve(path); // Image loaded successfully
                img.onerror = () => reject(`Failed to load image: ${path}`); // Handle loading errors
            });
        })
    );
};

const imagePaths = [];
const checkedFolders = [];

const logImagesInFolder = async (folderPath) => {
    try {
        const response = await fetch(folderPath);
        if (!response.ok)
            throw new Error(`Failed to fetch folder: ${folderPath}`);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        const links = Array.from(doc.querySelectorAll("a"));

        const promises = links.map(async (link) => {
            const href = link.getAttribute("href");
            if (href && (href.endsWith(".png") || href.endsWith(".gif"))) {
                console.log(`Found image: ${href}`);
                imagePaths.push(`${href}`);
            } else if (
                href.includes("/img/") &&
                !checkedFolders.includes(href) &&
                !href.includes(".")
            ) {
                checkedFolders.push(href);
                console.log(`Found folder: ${href}`);
                await logImagesInFolder(href);
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error(`Error logging images in folder: ${error.message}`);
    }
};

await logImagesInFolder("/img");

let grids = [];
for (let j = 0; j < 8; j++) {
    // Rows
    let row = []; // Create a new row
    for (let i = 0; i < 12; i++) {
        // Columns
        let x = i * 32 * 4;
        let y = j * 32 * 4;
        row.push(new Grid(x, y, "lightblue")); // Add each Grid to the current row
    }
    grids.push(row); // Add the row to the grids array
}

const game = new Game(grids);
window.game = game;

// Preload images and start the game
preloadImages(imagePaths)
    .then(() => {
        console.log("All images preloaded successfully!");
        let endtime = performance.now();
        console.log(
            `Time taken to preload images: ${(
                (endtime - startime) /
                1000
            ).toPrecision(6)} seconds`
        );
        game.playCollect();
    })
    .catch((error) => {
        console.error(error);
        alert("Image preloading failed. Check the console for details.");
    });
