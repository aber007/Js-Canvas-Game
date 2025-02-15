console.log("canvas.js loaded");
let canvas = document.querySelector("canvas");

import { Player } from "./Player.js";
import { Upgrades } from "./Upgrades.js";
import { Block } from "./objects.js";
import { CannonBall, Enemy } from "./objects.js";

canvas.width = 1536;
canvas.height = 768;

let img_nr = 2;
let edit_mode = false;

var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

addEventListener("keydown", (e) => {
  if (e.key == "e") {
    edit();
  }
  if (e.key == "s") {
    save();
  }
  if (e.key == "l") {
    load();
  }
  if (e.key == "u") {
    unload();
  }
});

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
      if (this.img.src.split(".").pop() == "png") {
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

// Create a 2D array for grids

// Edit mode
let savefile = {};
function save() {
  if (edit_mode) {
    let data = JSON.stringify(savefile);
    let blob = new Blob([data], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "texture.json";
    a.click();
    URL.revokeObjectURL(url);
  } else {
    alert("There is nothing to save");
  }
}
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
        if (!response.ok) throw new Error(`Failed to load file: ${fileName}`);
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
        // Chance to add a block at that row
        if (Math.random() < 0.01) {
          // Decide color of block (value)
          let color = "gray";
          const value = Math.random();
          if (value < 0.1) {
            color = "blue";
          } else if (value < 0.4) {
            color = "yellow";
          }
          game.blocks.push(new Block(x + 64, canvas.height / 2, 32, 32, color));
        }
      }
    }
  }
  savefile = data; // Update the global savefile variable
}

function edit() {
  edit_mode = !edit_mode;
  if (edit_mode) {
    console.log("Edit mode enabled");
    canvas.style.cursor = "crosshair";
    // Adjust collision and walkable properties with keys
    let lastMouseX = 0; // Track the last mouse X position
    let lastMouseY = 0; // Track the last mouse Y position

    // Track mouse movement over the canvas
    addEventListener("mousemove", (e) => {
      lastMouseX = e.clientX - canvas.getBoundingClientRect().left;
      lastMouseY = e.clientY - canvas.getBoundingClientRect().top;
    });

    // Listen for keydown events
    addEventListener("keydown", (e) => {
      // Calculate grid position based on the last mouse position
      let gridX = Math.floor(lastMouseY / 32 / 4);
      let gridY = Math.floor(lastMouseX / 32 / 4);
      console.log(gridX, gridY);  
      console.log(lastMouseX, lastMouseY);

      let grid = grids[gridX][gridY];
      if (!grid) return; // Ensure the grid cell exists

      // Toggle properties based on the key pressed
      if (e.key == "c") {
        grid.collidable = !grid.collidable;
        console.log(savefile);
        savefile[grid.coord].collidable = grid.collidable;
        showCollidable();
        console.log("Collision is: " + grid.collidable);
      }
      if (e.key == "x") {
        grid.walkable = !grid.walkable;
        showWalkable();
        savefile[grid.coord].walkable = grid.walkable;
        console.log("Walkable is: " + grid.walkable);
      }
    });

    addEventListener("mousedown", (e) => {
      if (e.button != 0) return; // Only left
      let x = e.clientX - canvas.getBoundingClientRect().left;
      let y = e.clientY - canvas.getBoundingClientRect().top;
      let grid = game.grids[Math.floor(y / 32 / 4)][Math.floor(x / 32 / 4)];
      let current_img = `img/tiles/sheet_${img_nr}.gif`;

      let save_img2_src = "";

      if (grid.img.src.includes("sheet_")) {
        save_img2_src = "img/tiles/" + grid.img.src.split("/").pop();
      }

      grid.img.src = current_img;
      grid.img.onload = () => {
        grid.draw();
      };
      // Save the current grid
      let img_name = current_img.split("/")[2];
      let save_img_src = "img/tiles/" + img_name;

      savefile[grid.coord] = {
        color: grid.color,
        img: save_img_src,
        img2: save_img2_src,
        collidable: grid.collidable,
        walkable: grid.walkable,
      };
    });
    addEventListener("contextmenu", (e) => {
      e.preventDefault(); // Prevent the default context menu
      let x = e.clientX - canvas.getBoundingClientRect().left;
      let y = e.clientY - canvas.getBoundingClientRect().top;
      let grid = game.grids[Math.floor(y / 32 / 4)][Math.floor(x / 32 / 4)];

      grid.img.src = "";
      grid.img2.src = "";

      delete savefile[grid.coord];

      // Clear the canvas section and redraw the default grid
      ctx.clearRect(grid.x, grid.y, grid.width, grid.height);
      grid.draw((color = grid.color)); // Redraw the default grid color
    });

    // Change current img with scroll
    addEventListener("wheel", (e) => {
      if (e.deltaY > 0) {
        if (img_nr == 71) return;
        img_nr++;
      } else {
        if (img_nr == 2) return;
        img_nr--;
      }
      // Display the current img
      const grid = game.grids[0][0];
      ctx.clearRect(grid.x, grid.y, grid.width, grid.height);
      let current_img = `img/tiles/sheet_${img_nr}.gif`;
      grid.img.src = current_img;
      grid.img.onload = () => {
        grid.draw();
      };
    });
  } else {
    console.log("Edit mode disabled");
    console.log(savefile);
    canvas.style.cursor = "default";
    removeEventListener("mousedown", () => {});
    removeEventListener("contextmenu", () => {});
    removeEventListener("wheel", () => {});
  }
}

function showWalkable() {
  for (let row of game.grids) {
    for (let grid of row) {
      if (grid.walkable) {
        grid.outline = "lightgreen";
        grid.draw();
      } else {
        grid.outline = "none";
        grid.draw();
      }
    }
  }
}
function showCollidable() {
  for (let row of game.grids) {
    for (let grid of row) {
      if (grid.collidable) {
        grid.outline = "red";
        grid.draw();
      } else {
        grid.outline = "none";
        grid.draw();
      }
    }
  }
}

function randomIntFromRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

class Cannon {
  constructor() {
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
      this.angle = Math.atan2(mouse.y - this.centerY, mouse.x - this.centerX);
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

    this.cannonBalls.push(
      new CannonBall(
        tipX,
        tipY - size / 2,
        size,
        size,
        this.cannonBallAngle,
        specialBall
      )
    );
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

    this.player = new Player(canvas, ctx, this);
    this.cannon = new Cannon();
    this.grids = grids;
    this.lastFrameTime = 0; // Track the last frame timestamp
    this.fpsInterval = 1000 / 60; // Desired time per frame (60 FPS)
    this.currentFrame = 0;

    this.leftx = this.player.x - canvas.width / 2;
    this.rightx = this.player.x + canvas.width / 2;
    this.pressed_keys = { a: false, d: false, space: false };
    this.currentTexturenr = 0;
    this.switchOnce = true;
    this.gameHasBeenSwitched = false;

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
    this.hat = new Image();
    this.hat.src = "img/background/hat.png";
    this.maybeHat = false;

    this.hud = new Image();
    this.hud.src = "img/background/UI.png";

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
    this.yellow = 0;
    this.gray = 0;
    this.blue = 0;
  }

  getRandomTexture() {
    while (true) {
      const random = randomIntFromRange(1, 6);
      if (random != this.currentTexturenr) {
        this.currentTexturenr = random;
        return random;
      }
    }
  }

  infinitewalk() {
    // Get the rightmost and leftmost grid

    let rightmost = this.grids[0][this.grids[0].length - 1].x;

    if (this.rightx >= rightmost && this.player.movement_direction == 1) {
      load(this.getRandomTexture(), this.grids[0].length);
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
          ctx.moveTo(drop.x + this.player.x - canvas.width / 2, drop.y);
          ctx.lineTo(drop.x + this.player.x - canvas.width / 2, drop.y + drop.length);
          ctx.stroke();
        }
      }
      
      const updateRain = (maxRainDrops) => {
        while (this.rainDrops.length < maxRainDrops) {
          this.rainDrops.push({
            x: (Math.random() * canvas.width * 2) - canvas.width / 2,
            y: Math.random() * canvas.height,
            length: Math.random() * 20,
            speed: Math.random() * 5 + 10,
          });
        }
        for (let drop of this.rainDrops) {
          drop.y += drop.speed;
          if (drop.y > canvas.height-128) {
            drop.y = -drop.length;
            drop.x = ((Math.random() * canvas.width * 2) - canvas.width / 2) + this.player.inverseX - canvas.width / 2;
          }
        }
      }

      const animateRain = (maxRainDrops) => {
        drawRain();
        updateRain(maxRainDrops);
      }

      if (event == 0) {
        // Normal
        red = Math.min(150 ,Math.floor((this.timer / this.maxTimer) * 255));
        green = 80;
        blue = Math.max(50 , Math.floor((1 - this.timer / this.maxTimer) * 255));
        front_red = red;
        front_green = green;
        front_blue = blue;
        oppacity = Math.max(0,0.4 - (this.maxTimer / 1000 - this.timer / 1000) * 0.5);
    
        
      } else if (event == 1) {
        // Rain
        oppacity = 0.1;
        this.maxRainDrops = 300;
        animateRain(this.maxRainDrops);

      } else if (event == 2) {
        // Mist
        red = Math.min(150 ,Math.floor((this.timer / this.maxTimer) * 255));
        green = 80;
        blue = Math.max(50 , Math.floor((1 - this.timer / this.maxTimer) * 255));
        front_red = 189;
        front_green = 177;
        front_blue = 194;

        red = Math.min(150 ,Math.floor((this.timer / this.maxTimer) * 255));
        green = 80;
        blue = Math.max(50 , Math.floor((1 - this.timer / this.maxTimer) * 255));
        oppacity = 0.5;

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
      console.log(this.timer)
      if (this.timer <= 10 * 60) {
        nightoverlay.style.backgroundColor = `rgba(8,8,8,${1 - this.timer / 600})`;
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
    if (this.allowLightning && randomIntFromRange(1,400) === 1) {
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
          (this.player.x < -16000 && this.player.x > -19000))
          && this.weather > 1
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
        ctx.fillStyle = `rgba(255, 255, 255, ${1.4 - 0.2*i})`;
        ctx.fillRect(lightningX, lightningY, lightningWidth, lightningHeight);
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

  displayTextBox(text, duration) {
    const textBox = document.createElement("div");
    textBox.style.position = "absolute";
    textBox.style.width = "300px";
    textBox.style.zIndex = "10";
    textBox.style.top = "100px";
    textBox.style.left = "50%";
    textBox.style.padding = "40px";
    textBox.style.transform = "translateX(-50%)";
    textBox.style.padding = "10px";
    textBox.style.backgroundColor = "rgba(234, 212, 170, 1)";
    textBox.style.color = "black";
    textBox.style.border = "1px solid rgba(184,111,80,1)";
    textBox.style.borderRadius = "5px";
    textBox.style.textAlign = "center";
    textBox.style.zIndex = "1000";
    textBox.style.fontSize = "20px";
    textBox.style.fontFamily = "Pixelify Sans";
    textBox.style.fontOpticalSizing = "auto";
    textBox.style.whiteSpace = "pre-wrap";
    textBox.innerText = text;

    document.body.appendChild(textBox);

    setTimeout(() => {
      document.body.removeChild(textBox);
    }, duration);
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
  }

  showHUD() {
    // Draw the HUD
    ctx.drawImage(this.hud, 0, 0, this.hud.width, this.hud.height);

    // Draw the hp bar
    const maxLength = 93;
    const healthLength = (this.health / this.maxHealth) * maxLength;
    ctx.fillStyle = "red";
    ctx.fillRect(73, 25, healthLength, 13);

    const inventoryLength = (this.weight / this.player.move_speed) * maxLength;
    ctx.fillStyle = "yellow";
    ctx.fillRect(287, 25, inventoryLength, 13);

    // Numbers of coins
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(this.gray, 475, 40);
    ctx.fillText(this.yellow, 585, 40);
    ctx.fillText(this.blue, 695, 40);

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

  updateCollect = () => {
    this.updatePlayerSpeed();
    this.infinitewalk();

    // update timer
    if (this.player.playerOffset >= 0) {
      if (this.timer <= 0 && !this.timeoutSet) {
        this.displayTextBox("You fell asleep. A mysterious creature brought you back, but took all your coins.", 5000);
        this.timeoutSet = true;
        setTimeout(() => {
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
            grid.x + grid.width > this.player.inverseX - canvas.width / 2 &&
            grid.x < this.player.inverseX + canvas.width / 2
          ) {
            grid.draw(this.player.x - canvas.width / 2);
          }
        } catch (e) {
          console.log(e);
          console.log(grid);
          console.log(this.grids);
        }
      }
    }

    for (const block of this.blocks) {
      block.update();
      block.draw(ctx, this.mouse);
    }
    // Update and draw the player
    this.displayCastle();
    this.player.update();
    this.showHUD();
    if (this.upgradeShopVisible) {
      this.upgrades.showUpgradeShop();
    }
    this.gameHasBeenSwitched = true;
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
    console.log(this.enemies);

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
          new Enemy(canvas.width - 128, canvas.height / 2, 32, 64, this)
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
      if (this.currentFrame > 20) {
        // 20 frames per animation
        this.currentFrame = 0;
        this.doAnimations();
        if (this.cannon.specialCooldown > 0) {
          this.cannon.specialCooldown -= 1 / 3;
        }
        if (this.cannon.normalCooldown > 0) {
          this.cannon.normalCooldown -= 1 / 3;
        }
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
    this.player.y = canvas.height - 256;
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
    removeEventListener("keydown", () => {});
    removeEventListener("keyup", () => {});
    removeEventListener("mousemove", () => {});
    removeEventListener("mousedown", () => {});
    removeEventListener("mouseup", () => {});
    removeEventListener("contextmenu", () => {});
  }

  playCannon() {
    this.displayTextBox("Use the mouse to aim and left click or hold to shoot. Right click to use your special cannonball.", 5000);
    unload();
    this.removeListeners();
    this.x = canvas.width / 2;

    this.blocks = [];
    this.towerDefense = true;
    // Remove previous event listeners

    // Plays the tower defence game
    addEventListener("mousemove", (event) => {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
    });
    addEventListener("mousedown", (e) => {
      if (e.button == 0) {
        this.mouse.pressed = true;
      } else if (e.button == 2 && this.cannon.specialCooldown <= 0) {
        this.cannon.img_nr = 2;
      }
    });
    addEventListener("mouseup", (e) => {
      if (e.button == 0) {
        this.mouse.pressed = false;
      }
    });
    addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.cannon.shoot(true);
    });
    load(-1);
  }

  playCollect() {
    unload();
    this.weather = randomIntFromRange(0, 3);
    this.timer = this.maxTimer;
    this.removeListeners();
    this.towerDefense = false;
    // Plays the collection game
    addEventListener("keydown", (e) => {
      if (e.key == "d") {
        this.pressed_keys.d = true;
        this.player.rightCollision = false;
      }
      if (e.key == "a") {
        this.pressed_keys.a = true;
        this.player.leftCollision = false;
      }
      if (e.key == " ") {
        this.pressed_keys.space = true;
        this.player.jump();
      }
      if (e.key == "q") {
        this.dropLastBlock();
      }
      if (e.key == "e") {
        if (
          this.player.playerOffset < -540 &&
          this.player.playerOffset > -700 &&
          this.switchOnce
        ) {
          this.switchOnce = false;
          this.switchGame();
          this.playerReady = true;
        }
      }
      if (e.key == "r") {
        this.upgradeShopVisible = !this.upgradeShopVisible;
      }
    });
    addEventListener("keyup", (e) => {
      if (e.key == "d") {
        this.pressed_keys.d = false;
      }
      if (e.key == "a") {
        this.pressed_keys.a = false;
      }
      if (e.key == " ") {
        this.pressed_keys.space = false;
      }
      if (e.key == "e") {
        this.switchOnce = true;
      }
    });

    // Start the animation loop
    this.lastFrameTime = performance.now();
    requestAnimationFrame(this.animateCollect);
    load(0);
  }
}
// Preload function
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
for (let i = 2; i < 72; i++) {
  imagePaths.push(`img/tiles/sheet_${i}.gif`);
}
// Load cannon imgages
for (let i = 1; i < 8; i++) {
  imagePaths.push(`img/cannon/${i}.gif`);
}
imagePaths.push("img/cannon/wheel.gif");

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
    game.playCollect(); // Start the game loop
  })
  .catch((error) => {
    console.error(error);
    alert("Image preloading failed. Check the console for details.");
  });
