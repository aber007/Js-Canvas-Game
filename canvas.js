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
      if (this.img2.src) {
        ctx.drawImage(this.img2, this.x + offset, this.y, this.width, this.height);
      }
      ctx.drawImage(this.img, this.x + offset, this.y, this.width, this.height);
      // Draw the outline
      if (this.outline != "none") {
        ctx.beginPath();
        ctx.rect(this.x + offset, this.y, this.width, this.height);
        ctx.strokeStyle = this.outline;
        ctx.stroke();
        ctx.closePath();
      }
    } else {
      ctx.beginPath();
      ctx.rect(this.x + offset, this.y, this.width, this.height);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
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
        alert(`Error: ${err.message}`);
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
  console.log(data);
  for (let key in data) {
    let [row, col] = key.split(",").map(Number); // Parse grid coordinates
    let grid = grids[row][col + offset];
    if (grid) {
      let x = (col + offset) * 32 * 4;
      let y = row * 32 * 4;
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

class Player {
  constructor() {
    this.movement_direction = 0;

    // X and Y position of the player camera
    this.x = canvas.width / 2;
    this.inverseX = canvas.width / 2;
    this.y = canvas.height / 2;

    this.move_speed = 6;
    this.jump_speed = 13;

    this.playerOffset = 0;
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
  }
  show_player(keepLastFrame = false) {
    // Draw on load
    ctx.drawImage(this.player_img, canvas.width/2+this.playerOffset, this.y, this.player_img.width*6, this.player_img.height*6);
    if (this.movement_direction == 1) {
      this.img_rotation = ""
    } else if (this.movement_direction == -1) {
      this.img_rotation = "-flip" // If direction is left
    }
    this.player_img.src = `img/player/${this.img_nr}${this.img_rotation}.gif`;
  }

  move() {
    // Update horizontal position
    if(this.leftCollision && this.vx < 0) {
      this.vx = 0;
    } else if(this.rightCollision && this.vx > 0) {
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
      this.current_grid = grids[grid_y+1][grid_x];
      this.nextGrid = grids[grid_y+1][grid_x+1];
    } catch (e) {
      // Do nothing. 
    }
    // Get the grids position from the left side of the canvas
  }
  check_collision() {
    if (this.current_grid) {
      // Handle walkable tiles (platform-like behavior)
      if (
        this.current_grid.walkable &&
        this.vy > 0// Falling downward
      ) {
        console.log(this.current_grid);
        this.vy = 0;
        this.y = this.current_grid.y - this.player_img.height * 6;
        this.onGround = true;
        return true; // Exit early since we landed
      }
  
      // Handle collidable tiles (full collision)
      if (this.nextGrid.collidable) {
        //Left collision
        if (this.inverseX + this.player_img.width > this.nextGrid.x - (32 * 2) ) {
          this.vx = 0;
          this.leftCollision = true;

          game.updatePosition(this.move_speed);
        }
        return true;
      }
      if (this.current_grid.collidable) {
        //Right collision
        if (this.inverseX < this.current_grid.x + this.current_grid.width) {
          this.vx = 0;
          this.rightCollision = true;

          game.updatePosition(-this.move_speed);
        }
        return;
      }

    }
  }
  
  

  update() {
    // Update the player's position
    this.get_current_grid();
    this.check_collision();
    this.applyGravity();
    this.move();
    this.show_player();
  }
}

class Game {
  constructor() {
    this.player = new Player();
    this.lastFrameTime = 0; // Track the last frame timestamp
    this.fpsInterval = 1000 / 60; // Desired time per frame (60 FPS)
    this.currentFrame = 0;

    this.leftx = 0;
    this.leftx = this.player.x - canvas.width / 2;
    this.rightx = this.player.x + canvas.width / 2;
    this.gravity = 0.05;
    this.pressed_keys = {a: false, d: false, space: false};

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

  updatePosition(update) {
    if(update < 0 && this.rightCollision) {
      update = 0;
    } else if(update > 0 && this.leftCollision) {
      update = 0;
    }
    this.player.vx = update;
    this.leftx -= update * 2;
    this.rightx -= update * 2;
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
        if (this.player.playerOffset <= -canvas.width / 2 + this.player.move_speed) return;
        this.player.vx = 0;
        this.player.playerOffset -= this.player.move_speed;
      } else {
        this.updatePosition(this.player.move_speed);
      }
    } else {
      this.player.vx = 0;
    }
  }

    update = () => {
      this.updatePlayerSpeed();
      this.infinitewalk();
    
      // Clear and redraw only visible grids
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let row of grids) {
        for (let grid of row) {
          if (
            grid.x + grid.width > this.player.inverseX - canvas.width / 2 &&
            grid.x < this.player.inverseX + canvas.width / 2
          ) {
            grid.draw(this.player.x - (canvas.width / 2));
          }
        }
      }    
      // Update and draw the player
      this.player.update();
    };

  animate = (timestamp) => {
    const elapsed = timestamp - this.lastFrameTime;


    // Run the game logic only if enough time has passed
    if (elapsed > this.fpsInterval) {
      this.lastFrameTime = timestamp;
      this.currentFrame++;
      if (this.currentFrame > 20) { // 20 frames per animation
        this.currentFrame = 0;
        this.doAnimations();
      }

      // Update game logic
      this.update();
    }

    // Request the next frame
    requestAnimationFrame(this.animate);
  };

  play() {
    // Set up controls
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
    requestAnimationFrame(this.animate);
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

// Preload images and start the game
preloadImages(imagePaths)
  .then(() => {
    console.log("All images preloaded successfully!");
    const game = new Game(); // Initialize your game instance
    game.play(); // Start the game loop
  })
  .catch((error) => {
    console.error(error);
    alert("Image preloading failed. Check the console for details.");
  });

