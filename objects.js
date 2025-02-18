const randomIntFromRange = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export class Block {
  constructor(x, y, width, height, color, elasticity = 0.8, playerNo = 0) {
    this.canvas = document.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
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
      this.current_grid = game.grids[grid_y + 1][grid_x];
      this.nextGrid = game.grids[grid_y + 1][grid_x + 1];
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

export class Enemy extends Block {
  constructor(x, y, width, height, game, elasticity = 0.8, playerNo = 0) {
    super(x, y, width, height, game, elasticity, playerNo);
    this.color = "red";
    this.img_nr = 1;
    this.texture = new Image();
    this.texture.src = `./img/enemy/fly/fly${this.img_nr}.gif`;
    this.action = "fly";
    this.y = randomIntFromRange(128, this.canvas.height - 128);
    this.x = this.canvas.width + 64;
    this.initalvx = randomIntFromRange(0.1, 0.24);

    this.hitBy = [];

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
      this.texture.src = `./img/enemy/fly/fly${this.img_nr}.gif`;
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
      this.texture.src = `./img/enemy/hit/hit${this.img_nr}.gif`;
    }, 200);
  }

  animateDeath() {
    clearInterval(this.flyAnimation);
    clearInterval(this.hitAnimation);
    this.deathAnimation = setInterval(() => {
      this.img_nr = 2;
      if (this.y < this.canvas.height) {
        this.vy += 2 * game.gravity;
        this.y += this.vy;
      } else {
        const index = game.enemies.indexOf(this);
        game.enemies.splice(index, 1);
        clearInterval(this.deathAnimation);
      }
      this.texture.src = `./img/enemy/die/die${this.img_nr}.gif`;
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
        if (this.hitBy.includes(ball) == false) {
          this.hitBy.push(ball);
          if (ball.special == "") {
            this.hp -= game.cannon.normalDamage;
          } else {
            this.hp -= game.cannon.specialDamage;
          }
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
  }

  update() {
    const vy = randomIntFromRange(-0.1, 0.1);
    this.y += vy;
    this.x -= this.initalvx;
    if (this.y > this.canvas.height + 128) {
      this.y = this.canvas.height - 256;
    }

    this.x -= 0.4;
    this.draw(this.ctx);
    this.checkCollisionWithCannonBall();
  }
}

export class CannonBall extends Block {
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
      if (this.y > this.canvas.height) {
        this.alive = false;
      }

      this.draw(this.ctx);
    } else {
      this.killCannonBall();
    }
  }
  killCannonBall() {
    this.alive = false;
    // Remove the cannon ball from the cannon balls array
    const index = game.cannon.cannonBalls.indexOf(this);
    game.cannon.cannonBalls.splice(index, 1);
  }
}
