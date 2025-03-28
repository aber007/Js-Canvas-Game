import { Player } from "./player.js";

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
    this.vx = 1;
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

  draw(ctx) {
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
}
// Enemies in the platformer part
export class Enemy2 extends Block {
  constructor(x, y, width, height, color = "red") {
    super(x, y, width, height, color);
  }
  move() {
    this.initialX += this.vx;
    this.y += this.vy;
  }
  update() {
    console.log(this.initialX)
    this.move();
    this.draw(this.ctx);
  }
}
// Enemies in the tower defence part
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
    this.canBeHit = true;

    this.hitBy = [];

    this.hp = 3 + randomIntFromRange(game.round, 2*game.round);

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
            this.canBeHit = false;
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

    if (this.x < 256) {
      const index = game.enemies.indexOf(this);
      game.enemies.splice(index, 1);
      game.health -= 2;
    }

    this.x -= 0.4;
    this.draw(this.ctx);
    if (this.canBeHit) {
      this.checkCollisionWithCannonBall();
    }
  }
}

export class CannonBall extends Block {
  constructor(x, y, width, height, angle, special, speed) {
    super(x, y, width, height, game);
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vx = game.cannon.ballSpeed + speed;
    if (
      (game.cannon.ballSpeed + speed) * this.angle <
      -(game.cannon.ballSpeed + speed)
    ) {
      this.vy = -(game.cannon.ballSpeed + speed);
    } else if (
      (game.cannon.ballSpeed + speed) * this.angle >
      game.cannon.ballSpeed + speed
    ) {
      this.vy = game.cannon.ballSpeed + speed;
    } else {
      this.vy = (game.cannon.ballSpeed + speed) * this.angle;
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
  playerRequiresAimingHelp() {
    // aim sligtly towaeards the closest enemy
    let enemyDistances = [];
    if(game.enemies.length == 0){
      return;
    }
    for (let enemy of game.enemies) {
      enemyDistances.push(
        Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2)
      );
    }
    const closestEnemy =
      game.enemies[enemyDistances.indexOf(Math.min(...enemyDistances))];
    if (closestEnemy.y < this.y) {
      this.vy -= 0.1 + (0.3*game.upgrades.upgrades["homing2"].unlocked)  + game.gravity;;
    } else {
      this.vy += 0.01 + (0.01*game.upgrades.upgrades["homing2"].unlocked)
    }
  }

  update() {
    if (this.alive) {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += game.gravity;
      this.vy *= game.airResistance;
      this.vx *= game.airResistance;
      if (game.upgrades.upgrades["homing1"].unlocked && this.special == "") {
        this.playerRequiresAimingHelp();
      }
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
