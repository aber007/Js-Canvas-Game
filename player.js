export class Player {
  constructor(canvas, ctx, game) {
    this.movement_direction = 0;
    this.canvas = canvas;
    this.ctx = ctx;
    this.game = game;

    // X and Y position of the player camera
    this.x = this.canvas.width / 2;
    this.inverseX =this.canvas.width / 2;
    this.y =this.canvas.height / 2;

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
  show_player() {
    // Draw on load
    this.ctx.drawImage(
      this.player_img,
      this.canvas.width / 2 + this.playerOffset,
      this.y,
      this.player_img.width * this.game.img_scale,
      this.player_img.height * this.game.img_scale
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
      this.current_grid = this.game.grids[grid_y + 1][grid_x];
      this.nextGrid = this.game.grids[grid_y + 1][grid_x + 1];
      this.gridUnder = this.game.grids[grid_y + 2][grid_x];
    } catch (e) {
      console.log(e);
    }
    // Get the grids position from the left side of the canvas
  }
  checkCollisionWithBlock() {
    // Check if the player is colliding with block
    for (const block of this.game.blocks) {
      if (
        this.inverseX - this.canvas.width / 2 + this.player_img.width * 3 <
          block.x + block.width &&
        this.inverseX -this.canvas.width / 2 + this.player_img.width * 3 >
          block.x &&
        this.y < block.y + block.height &&
        this.y + this.player_img.height > block.y - 128
      ) {
        // Add value to score
        if (block.canBePickedUp) {
          if (block.color === "yellow") {
            this.game.inventory.push("yellow");
          } else if (block.color === "gray") {
            this.game.inventory.push("gray");
          } else if (block.color === "blue") {
            this.game.inventory.push("blue");
          }
          this.game.weight += 1;
        }
        block.canBePickedUp = false;
        // Delete block from blocks
        const index = this.game.blocks.indexOf(block);
        this.game.blocks.splice(index, 1);
      }
    }
  }
  redeemCoins() {
    if (this.playerOffset < 0) {
      if (game.inventory.includes("yellow")) {
        this.game.yellow += 1;
        this.game.weight -= 1;
        this.game.inventory.splice(game.inventory.indexOf("yellow"), 1);
      }
      if (game.inventory.includes("gray")) {
        this.game.gray += 1;
        this.game.weight -= 1;
        this.game.inventory.splice(game.inventory.indexOf("gray"), 1);
      }
      if (game.inventory.includes("blue")) {
        this.game.blue += 1;
        this.game.weight -= 1;
        this.game.inventory.splice(game.inventory.indexOf("blue"), 1);
      }
    }
  }

  check_collision() {
    if (this.current_grid) {
      // Handle walkable tiles (platform-like behavior)
      const nextGridOffset = Math.abs(this.nextGrid.x - this.inverseX);
      if (
        (this.current_grid.walkable && this.vy > 0) || // Falling downward
        (this.vy > 0 &&
          this.nextGrid.walkable &&
          nextGridOffset < this.player_img.width * this.game.img_scale)
      ) {
        this.vy = 0;
        this.y =
          this.current_grid.y - this.player_img.height * this.game.img_scale;
        this.onGround = true;
        this.leftCollision = false;
        this.rightCollision = false;
        return true; // Exit early since we landed
      }
      if (
        !this.gridUnder.walkable &&
        nextGridOffset > this.player_img.width * this.game.img_scale
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
    this.redeemCoins();
  }
}
