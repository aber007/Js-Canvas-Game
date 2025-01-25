export class Block {
    constructor(x, y, width, height, game, elasticity = 0.8, playerNo = 0) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.vx = 0;
      this.vy = 0;
      this.elasticity = elasticity;
      this.playerNo = playerNo;
      this.color = "rgba(0, 128, 255, 0.8)";
      this.mass = width * height;
      this.angle = 0;
      this.angularVelocity = 0;
      this.line = false;
    }

    draw(ctx, mouse) {
      if (this.line) {
        // Draw the rope
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw the block
      ctx.save();
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.color;
      ctx.fillRect(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
      ctx.restore();
    }

    update() {
      // Apply gravity if no collision

      this.vy += this.game.gravity;

      // Update position
      this.x += this.vx;
      this.y += this.vy;

      // Collide with ground
      if (this.y > this.game.canvasHeight - this.height) {
        this.y = this.game.canvasHeight - this.height;
        this.vy = -this.vy * this.elasticity;
        this.vx *= this.game.friction + Math.random() * 0.01;
      }

      // Collide with walls
      if (this.x < 0) {
        this.x = 0;
        this.vx = -this.vx * this.elasticity; 
      } else if (this.x > this.game.canvasWidth - this.width) {
        this.x = this.game.canvasWidth - this.width;
        this.vx = -this.vx * this.elasticity;
      }

      // Apply air resistance
      this.vx *= this.game.airResistance + Math.random() * 0.01;
      this.vy *= this.game.airResistance + Math.random() * 0.01;
    }

    grab(mouse) {
      if (mouse.pressed) {
        this.grabbed = false;
        const lineLength = Math.sqrt(
          (this.x + this.width / 2 - mouse.x) ** 2 +
            (this.y + this.height / 2 - mouse.y) ** 2
        );
        if (lineLength < 150 || this.line) {
            this.line = true;
            this.airResistance = 0.99;
            if (lineLength > 150) {
                const stretchX = (this.x + this.width / 2 - mouse.x) / lineLength;
                const stretchY = (this.y + this.height / 2 - mouse.y) / lineLength;
                const force = (lineLength - 150) * this.game.ropeElasticity;
                this.vx -= stretchX * force;
                this.vy -= stretchY * force;
            }
        } else {
            this.airResistance = 0.995;
        }
      } else {
        this.line = false;
        this.airResistance = 0.995;
      }
    }
  }

  class Game {
    constructor() {
      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas.getContext("2d");

      // Set canvas size
      this.canvasWidth = 1200;
      this.canvasHeight = 700;
      this.canvas.width = this.canvasWidth;
      this.canvas.height = this.canvasHeight;

      // Game parameters
      this.gravity = 0.5;
      this.friction = 0.9;
      this.airResistance = 0.995;
      this.ropeElasticity = 0.1;

      // Game state
      this.blocks = [
        new Block(375, 0, 50, 50, this),
        new Block(375, 100, 50, 50, this),
      ];
      this.mouse = { x: 0, y: 0, pressed: false };

      // Bind events
      this.bindEvents();

      // Start the game loop
      this.loop();
    }

    bindEvents() {
      this.canvas.addEventListener("mousemove", (event) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
      });

      this.canvas.addEventListener("mousedown", () => {
        this.mouse.pressed = true;
      });

      this.canvas.addEventListener("mouseup", () => {
        this.mouse.pressed = false;
      });
    }

    loop() {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      // Update and draw blocks
      for (const block of this.blocks) {
        block.update();
        block.draw(this.ctx, this.mouse);
        block.grab(this.mouse);
      }

      // Next frame
      requestAnimationFrame(() => this.loop());
    }
  }