console.log("canvas.js loaded");
let canvas = document.querySelector("canvas");

canvas.width = 768 * 2;
canvas.height = 512 * 1.5;

let img_nr = 2;
let edit_mode = false;

var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

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
  // Clear the grids array
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
    let grid = grids[row][col + offset];
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
      grids[row][col + offset] = grid;

      // Get longest row
      let longest_row = 0;
      for (let row of grids) {
        if (row.length > longest_row) {
          longest_row = row.length;
        }
      }
      // Add new empty grids to rows that are shorter
      for (let row of grids) {
        while (row.length < longest_row) {
          let x = row.length * 32 * 4;
          let y = row[0].y;
          let grid = new Grid(x, y, "lightblue");
          row.push(grid);
        }
        // Chance to add a block at that row
        if (Math.random() < 0.01) {
          // Decide color of block (value)
          let color = "blue";
          const value = Math.random();
          if (value < 0.1) {
            color = "yellow";
          } else if (value < 0.4) {
            color = "green";
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
    canvas.addEventListener("mousemove", (e) => {
      lastMouseX = e.clientX - canvas.getBoundingClientRect().left;
      lastMouseY = e.clientY - canvas.getBoundingClientRect().top;
    });

    // Listen for keydown events
    addEventListener("keydown", (e) => {
      // Calculate grid position based on the last mouse position
      let gridX = Math.floor(lastMouseY / 32 / 4);
      let gridY = Math.floor(lastMouseX / 32 / 4);

      let grid = grids[gridX][gridY];
      if (!grid) return; // Ensure the grid cell exists

      // Toggle properties based on the key pressed
      if (e.key == "c") {
        grid.collidable = !grid.collidable;
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
      let grid = grids[Math.floor(y / 32 / 4)][Math.floor(x / 32 / 4)];
      let current_img = `img/tiles/sheet_${img_nr}.gif`;

      let save_img2_src = "";
      if (grid.img.src.split("/")[3] != "index.htm") {
        save_img2_src = "img/tiles/" + grid.img.src.split("/").pop();
        grid.img.src = current_img;
        console.log("Grid has tile");
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
      let grid = grids[Math.floor(y / 32 / 4)][Math.floor(x / 32 / 4)];

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
      grid = grids[0][0];
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
  for (let row of grids) {
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
  for (let row of grids) {
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

class Player {
  constructor() {
    this.movement_direction = 0;

    // X and Y position of the player camera
    this.x = canvas.width / 2;
    this.inverseX = canvas.width / 2;
    this.y = canvas.height / 2;

    this.money = 0;

    this.move_speed = 6;
    this.jump_speed = 13;

    this.playerOffset = -600;
    this.playery = 0;

    this.vx = 0;
    this.vy = 0;
    this.current_grid = null;
    this.jump_height = 0;
    this.player_img = new Image();
    this.gravity = 0.5;
    this.img_nr = 1;
    this.img_rotation = "";
    this.player_img.src = `img/player/${this.img_nr}${this.img_rotation}.gif`;

    this.onGround = false;
    this.leftCollision = false;
    this.rightCollision = false;
    this.lastgrid = null;
  }
  show_player(keepLastFrame = false) {
    // Draw on load
    ctx.drawImage(
      this.player_img,
      canvas.width / 2 + this.playerOffset,
      this.y,
      this.player_img.width * game.img_scale,
      this.player_img.height * game.img_scale
    );
    if (this.movement_direction == 1) {
      this.img_rotation = "";
    } else if (this.movement_direction == -1) {
      this.img_rotation = "-flip"; // If direction is left
    }
    this.player_img.src = `img/player/${this.img_nr}${this.img_rotation}.gif`;
  }

  move() {
    // Update horizontal position
    if (this.leftCollision && this.vx < 0) {
      this.vx = 0;
    } else if (this.rightCollision && this.vx > 0) {
      this.vx = 0;
    }
    this.x += this.vx;
    this.inverseX -= this.vx;

    // Update vertical position
    this.y += this.vy;
  }

  jump() {
    // Jump logic
    if (this.onGround) {
      this.vy = -this.jump_speed;
      this.onGround = false;
      this.leftCollision = false;
      this.rightCollision = false;
    }
  }
  applyGravity() {
    if (!this.onGround) {
      this.vy += this.gravity;
    } else {
      this.vy = 0; // Reset vertical velocity when grounded
    }
  }
  get_current_grid() {
    // Get the current grid the player is on
    let grid_x = Math.floor(this.inverseX / 32 / 4);
    let grid_y = Math.floor(this.y / 32 / 4);
    try {
      this.current_grid = grids[grid_y + 1][grid_x];
      this.nextGrid = grids[grid_y + 1][grid_x + 1];
      this.gridUnder = grids[grid_y + 2][grid_x];
    } catch (e) {
      // Do nothing.
    }
    // Get the grids position from the left side of the canvas
  }
  checkCollisionWithBlock() {
    // Check if the player is colliding with block
    for (const block of game.blocks) {
      if (
        this.inverseX - canvas.width / 2 + this.player_img.width * 3 <
          block.x + block.width &&
        this.inverseX - canvas.width / 2 + this.player_img.width * 3 >
          block.x &&
        this.y < block.y + block.height &&
        this.y + this.player_img.height > block.y - 128
      ) {
        // Add value to score
        if (block.canBePickedUp) {
          if (block.color === "yellow") {
            game.inventory.push("yellow");
          } else if (block.color === "green") {
            game.inventory.push("green");
          } else if (block.color === "blue") {
            game.inventory.push("blue");
          }
          game.weight += 1;
        }
        block.canBePickedUp = false;
        // Delete block from blocks
        const index = game.blocks.indexOf(block);
        game.blocks.splice(index, 1);
      }
    }
  }

  drawInfoBar(ctx) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, 30);

    // Draw the health text
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Health: " + game.health, 10, 20);
    ctx.fillText("Yellow: " + game.yellow, 150, 20);
    ctx.fillText("Green: " + game.green, 320, 20);
    ctx.fillText("Blue: " + game.blue, 490, 20);
  }

  check_collision() {
    if (this.current_grid) {
      // Handle walkable tiles (platform-like behavior)
      const nextGridOffset = Math.abs(this.nextGrid.x - this.inverseX);
      if (
        (this.current_grid.walkable && this.vy > 0) || // Falling downward
        (this.vy > 0 &&
          this.nextGrid.walkable &&
          nextGridOffset < this.player_img.width * game.img_scale)
      ) {
        this.vy = 0;
        this.y = this.current_grid.y - this.player_img.height * game.img_scale;
        this.onGround = true;
        this.leftCollision = false;
        this.rightCollision = false;
        return true; // Exit early since we landed
      }
      if (
        !this.gridUnder.walkable &&
        nextGridOffset > this.player_img.width * game.img_scale
      ) {
        this.onGround = false;
      }

      // Handle collidable tiles (full collision)
      if (this.nextGrid.collidable && !this.leftCollision) {
        //Left collision
        if (this.inverseX + this.player_img.width > this.nextGrid.x - 32 * 2) {
          this.vx = 0;
          this.leftCollision = true;
        }
        return true;
      }
      if (this.current_grid.collidable && !this.rightCollision) {
        //Right collision
        if (this.inverseX < this.current_grid.x + this.current_grid.width) {
          this.vx = 0;
          this.rightCollision = true;
        }
        return true;
      }
    }
  }

  update() {
    // Update the player's position
    this.get_current_grid();
    const yOffset = this.check_collision();
    this.checkCollisionWithBlock();
    this.applyGravity();
    this.move();
    this.show_player();
    this.drawInfoBar(ctx);
  }
}

class Block {
  constructor(x, y, width, height, color, elasticity = 0.8, playerNo = 0) {
    this.initialX = x;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vx = 0;
    this.vy = 0;
    this.elasticity = elasticity;
    this.playerNo = playerNo;
    this.color = color;
    this.mass = width * height;
    this.angle = 0;
    this.angularVelocity = 0;
    this.line = false;
    this.lineOffset = 0;
    this.offset = 0;
    this.current_grid = null;
    this.nextGrid = null;
    this.canBePickedUp = true;
    this.grabbed = false;
  }

  draw(ctx, mouse) {
    if (this.line) {
      // Draw the rope
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
      ctx.lineTo(
        canvas.width / 2 + game.player.player_img.width * 3,
        game.player.y + game.player.player_img.height * 3
      );
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw the block
    ctx.save();
    ctx.translate(
      game.player.x -
        this.lineOffset +
        this.offset +
        this.initialX +
        this.width / 2,
      this.y + this.height / 2
    );
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }

  get_current_grid() {
    // Get the current grid the player is on
    let grid_x = Math.floor((this.x - this.width) / 32 / 4);
    let grid_y = Math.floor((this.y - this.height) / 32 / 4);
    try {
      this.current_grid = grids[grid_y + 1][grid_x];
      this.nextGrid = grids[grid_y + 1][grid_x + 1];
    } catch (e) {
      // Do nothing.
    }
    // Get the grids position from the left side of the canvas
  }

  update() {
    this.get_current_grid();

    // Check if block is outside of the canvas

    // Update position

    // Collide with grid
    this.vy += game.gravity;
    this.y += this.vy;

    if (this.current_grid) {
      if (
        this.current_grid.walkable &&
        this.vy > 0 // Falling downward
      ) {
        this.y = this.current_grid.y - this.height;
        this.vy = -this.vy * this.elasticity;
      }
    }

    // Call grab method to check if the block should be grabbed
  }
}

class Enemy extends Block {
  constructor(x, y, width, height, game, elasticity = 0.8, playerNo = 0) {
    super(x, y, width, height, game, elasticity, playerNo);
    this.color = "red";
    this.img_nr = 1;
    this.texture = new Image();
    this.texture.src = `img/enemy/fly/fly${this.img_nr}.gif`;
    this.action = "fly";
    this.y = randomIntFromRange(128, canvas.height - 128);
    this.x = canvas.width + 64;

    this.hp = 3;

    setTimeout(() => {
      this.animateFly();
    }, randomIntFromRange(0, 250));
  }
  draw(ctx) {
    ctx.drawImage(
      this.texture,
      this.x,
      this.y,
      this.texture.width * 4,
      this.texture.height * 4
    );
  }

  animateFly() {
    // Wait 0.25 seconds before starting the animation

    this.flyAnimation = setInterval(() => {
      if (this.img_nr < 8) {
        this.img_nr += 1;
      } else {
        this.img_nr = 1;
      }
      this.texture.src = `img/enemy/fly/fly${this.img_nr}.gif`;
    }, 250);
  }
  animateHit() {
    this.img_nr = 0;
    this.hitAnimation = setInterval(() => {
      if (this.img_nr < 4) {
        this.img_nr += 1;
      } else {
        this.img_nr = 1;
        clearInterval(this.hitAnimation);
      }
      this.texture.src = `img/enemy/hit/hit${this.img_nr}.gif`;
    }, 200);
  }

  animateDeath() {
    clearInterval(this.flyAnimation);
    clearInterval(this.hitAnimation);
    this.deathAnimation = setInterval(() => {
      this.img_nr = 2;
      if (this.y < canvas.height) {
        this.vy += 2 * game.gravity;
        this.y += this.vy;
      } else {
        const index = game.enemies.indexOf(this);
        game.enemies.splice(index, 1);
        clearInterval(this.deathAnimation);
      }
      this.texture.src = `img/enemy/die/die${this.img_nr}.gif`;
    }, 50);
  }

  checkCollisionWithCannonBall() {
    for (let ball of game.cannon.cannonBalls) {
      if (
        this.x + 10 < ball.x + ball.width &&
        this.x + this.width > ball.x &&
        this.y < ball.y + ball.height &&
        this.y + this.height > ball.y
      ) {
        this.hp -= 1;
        if (ball.special != "pierce") {
          ball.killCannonBall();
        }
        if (this.hp <= 0) {
          // Remove self from the enemies array
          this.animateDeath();
        } else {
          this.animateHit();
        }
      }
    }
  }

  update() {
    const vy = randomIntFromRange(-0.1, 0.1);
    const vx = randomIntFromRange(-0.1, 0.1);
    this.y += vy;
    this.x -= vx;
    if (this.y > canvas.height + 128) {
      this.y = canvas.height - 256;
    }

    this.x -= 0.4;
    this.draw(ctx);
    this.checkCollisionWithCannonBall();
  }
}

class CannonBall extends Block {
  constructor(x, y, width, height, angle, special) {
    super(x, y, width, height);
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vx = game.cannon.ballSpeed;
    if (game.cannon.ballSpeed * this.angle < -game.cannon.ballSpeed) {
      this.vy = -game.cannon.ballSpeed;
    } else if (game.cannon.ballSpeed * this.angle > game.cannon.ballSpeed) {
      this.vy = game.cannon.ballSpeed;
    } else {
      this.vy = game.cannon.ballSpeed * this.angle;
    }
    this.color = "black";
    this.alive = true;
    this.special = special;
  }
  draw(ctx) {
    // Draw the cannon ball as a circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
  update() {
    if (this.alive) {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += game.gravity;
      this.vy *= game.airResistance;
      this.vx *= game.airResistance;
      if (this.y > canvas.height) {
        this.alive = false;
      }

      this.draw(ctx);
    }
  }
  killCannonBall() {
    this.alive = false;
    // Remove the cannon ball from the cannon balls array
    const index = game.cannon.cannonBalls.indexOf(this);
    game.cannon.cannonBalls.splice(index, 1);
  }
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
    this.specialDamage = 1;
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
  constructor() {
    this.towerDefense = false;

    this.player = new Player();
    this.cannon = new Cannon();
    this.lastFrameTime = 0; // Track the last frame timestamp
    this.fpsInterval = 1000 / 60; // Desired time per frame (60 FPS)
    this.currentFrame = 0;

    this.leftx = 0;
    this.leftx = this.player.x - canvas.width / 2;
    this.rightx = this.player.x + canvas.width / 2;
    this.gravity = 0.05;
    this.pressed_keys = { a: false, d: false, space: false };

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
    this.hat.src = "img/background/hat.gif";
    this.maybeHat = false;

    // Game parameters
    this.gravity = 0.5;
    this.friction = 0.9;
    this.airResistance = 0.99;
    this.ropeElasticity = 0.1;

    // Collect settings
    this.weight = 0;
    this.weightMultiplier = 1;
    this.inventory = [];


    // Img settints
    this.img_scale = 6;

    // Game state
    this.blocks = [new Block(500, 200, 32, 32, "blue")];
    this.mouse = { x: 0, y: 0, pressed: false };

    // Tower defence related
    this.enemies = [];
    this.round = 0;
    this.playerReady = false;
    this.health = 10;
    this.yellow = 0;
    this.green = 0;
    this.blue = 0;
  }

  getRandomTexture() {
    return Math.floor(Math.random() * 2) + 1;
  }

  infinitewalk() {
    // Get the rightmost and leftmost grid

    let rightmost = grids[0][grids[0].length - 1].x;

    if (this.rightx >= rightmost && this.player.movement_direction == 1) {
      load(this.getRandomTexture(), grids[0].length);
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
    if(update > 0){
      update -= this.weight / this.weightMultiplier;
      if (update < 2) {
        update = 2;
      }
    } else if (update < 0){
      update += this.weight / this.weightMultiplier;
      if (update > -2) {
        update = -2;
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

    for (let i = 0; i < bgImages.length; i++) {
      let img = bgImages[i];
      let speed = speeds[i];
      let x = (this.player.x / speed) % img.width;

      // Show the creature
      if (
        i == 7 &&
        x < -156 &&
        x > -555 &&
        (this.player.x > -5000 ||
          (this.player.x < -16000 && this.player.x > -19000))
      ) {
        ctx.drawImage(
          this.bg11,
          x + 1500,
          canvas.height / 2 + 160,
          this.bg11.width,
          this.bg11.height
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
  }

  updateCollect = () => {
    this.updatePlayerSpeed();
    this.infinitewalk();

    // Clear and redraw only visible grids
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.updateBackground();
    for (let row of grids) {
      for (let grid of row) {
        if (
          grid.x + grid.width > this.player.inverseX - canvas.width / 2 &&
          grid.x < this.player.inverseX + canvas.width / 2
        ) {
          grid.draw(this.player.x - canvas.width / 2);
        }
      }
    }

    for (const block of this.blocks) {
      block.update();
      block.draw(ctx, this.mouse);
    }

    // Update and draw the player
    this.player.update();
  };

  updateCannon = () => {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row of grids) {
      for (let grid of row) {
        grid.draw(this.player.x - canvas.width / 2);
      }
    }

    this.cannon.update();
    for (let enemy of this.enemies) {
      enemy.update();
    }

    if (this.playerReady) {
      this.round += 1;
      // Spawn enemies
      this.playerReady = false;
      for (let i = 0; i < this.round * Math.round(Math.random() * 3 + 1); i++) {
        this.enemies.push(
          new Enemy(canvas.width - 128, canvas.height / 2, 32, 64, this)
        );
      }
    }
    for (let enemy of this.enemies) {
      enemy.update();
    }
    if (this.enemies.length == 0) {
      this.round += 1;
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
      console.log("Switching to tower defense");
      requestAnimationFrame(this.animateCannon);
    } else {
      requestAnimationFrame(this.animateCollect);
    }
  };

  switchGame() {
    if (this.towerDefense) {
      this.playCollect();
    } else {
      this.playCannon();
    }
  }

  playCannon() {
    unload();
    this.x = canvas.width / 2;

    this.blocks = [];
    this.towerDefense = true;
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
      if (e.key == "e") {
        this.switchGame();
        this.playerReady = true;
      }
      if (e.key == "q") {
        this.dropLastBlock();
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

const game = new Game();

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
