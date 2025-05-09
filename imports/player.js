import { Hitbox2D } from "./objectsquare.js";

export class Player {
    constructor(canvas, ctx, game) {
        this.movement_direction = 0;
        this.canvas = canvas;
        this.ctx = ctx;
        /**
         * @type {import('../canvas.js').Game}
         */

        this.game = game;

        // X and Y position of the player camera
        this.x = this.canvas.width / 2;
        this.inverseX = this.canvas.width / 2;
        this.y = this.canvas.height - 256;
        this.playerOffset = -500;
        this.playery = 0;

        this.move_speed = 6;
        this.jump_speed = 12;

        this.vx = 0;
        this.vy = 0;
        this.current_grid = null;
        this.jump_height = 0;
        this.player_img = new Image();
        this.gravity = 0.55;
        this.img_nr = 1;
        this.img_rotation = "";
        this.player_img.src = `./img/player/${this.img_nr}${this.img_rotation}.gif`;
        this.width = 15 * 6;
        this.height = 22 * 6;
        this.hitbox = new Hitbox2D(
            this.canvas.width / 2 + this.playerOffset,
            this.y,
            this.width,
            this.height,
            "player",
            10,
            0,
            10,
            10
        );

        this.onGround = false;
        this.leftCollision = false;
        this.rightCollision = false;
        this.lastgrid = null;
        this.lockMovement = false; // Prevents movement when colliding with enemy
        this.bounceBackSpeed = 6;
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
        this.player_img.src = `./img/player/${this.img_nr}${this.img_rotation}.gif`;
    }

    move() {
        // Update horizontal position
        if (this.lockMovement) {
            this.vx = this.bounceBackSpeed;
        }
        if (this.leftCollision && this.vx < 0) {
            this.vx = 0;
        } else if (this.rightCollision && this.vx > 0) {
            this.vx = 0;
        }
        this.x += this.vx;
        this.game.leftx -= this.vx;
        this.game.rightx -= this.vx;
        this.inverseX -= this.vx;
        // Update vertical position
        this.y += this.vy;
    }

    jump(force = false) {
        // Jump logic
        if (this.onGround || force) {
            this.vy = -this.jump_speed;
            this.onGround = false;
            this.leftCollision = false;
            this.rightCollision = false;
        }
    }
    applyGravity() {
        if (!this.onGround) {
            if (this.vy < 15) {
                this.vy += this.gravity;
            }
        } else {
            this.lockMovement = false; // Reset lockMovement when grounded
            this.vy = 0; // Reset vertical velocity when grounded
        }
    }
    get_current_grid() {
        if (this.y > this.canvas.height) {
            // switch the game without screwing up the rest of the code. Hopefully I remember to do this
            this.x = this.canvas.width / 2;
            this.inverseX = this.canvas.width / 2;
            this.y = this.canvas.height - 256;
            this.playerOffset = -500;
            this.playery = 0;
            this.vy = 0;
            this.game.health -= 1;
            this.game.timer = Math.max(this.game.timer - 60 * 20, 0);
            this.game.leftx = this.x - this.canvas.width / 2;
            this.game.rightx = this.x + this.canvas.width / 2;
        }
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
    }
    checkCollisionWithBlock() {
        // Check if the player is colliding with block
        for (const block of this.game.blocks) {
            if (this.hitbox.collidesWith(block.hitbox) && block.canBePickedUp) {
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
                    block.canBePickedUp = false;
                }
                // Delete block from blocks
                const index = this.game.blocks.indexOf(block);
                this.game.blocks.splice(index, 1);
            }
            // Check collision using Hitbox2D
        }
    }
    checkCollisionWithEnemy() {
        // Check if the player is colliding with enemy during collect
        for (const enemy of this.game.collect_enemies) {
            const hit = this.hitbox.collidesWith(enemy.hitbox);
            if (hit) {
                if (hit === "up" && enemy.type === "bunny") {
                    this.game.collect_enemies.splice(
                        this.game.collect_enemies.indexOf(enemy),
                        1
                    );
                    return;
                }
                if (this.game.invulnerable) return;
                // Add value to score
                this.game.health -= 1;
                this.vy = 0;
                this.jump(true);
                this.vx = 5;
                this.lockMovement = true;
                // Set invurnability for 1 second
                this.game.invulnerable = true;
                setTimeout(() => {
                    this.game.invulnerable = false;
                }, 3000);
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
                (this.current_grid.walkable &&
                    this.vy > 0 &&
                    this.y < this.current_grid.y &&
                    this.y - this.current_grid.y < 0) || // Falling downward
                (this.vy > 0 &&
                    this.nextGrid.walkable &&
                    nextGridOffset <
                        this.player_img.width * this.game.img_scale &&
                    this.y - this.current_grid.y < 0)
            ) {
                this.vy = 0;
                this.y =
                    this.current_grid.y -
                    this.player_img.height * this.game.img_scale;
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
                if (
                    this.inverseX + this.player_img.width >
                    this.nextGrid.x - 32 * 2
                ) {
                    // Reset position to exactly where collision occurred
                    this.inverseX =
                        this.nextGrid.x - 32 * 2 - this.player_img.width;
                    this.x = this.canvas.width - this.inverseX;
                    this.vx = 0;
                    this.leftCollision = true;
                    return true;
                }
            }
            if (this.current_grid.collidable && !this.rightCollision) {
                //Right collision
                if (
                    this.inverseX <
                    this.current_grid.x + this.current_grid.width
                ) {
                    // Reset position to exactly where collision occurred
                    this.inverseX =
                        this.current_grid.x + this.current_grid.width;
                    this.x = this.canvas.width - this.inverseX;
                    this.vx = 0;
                    this.rightCollision = true;
                    return true;
                }
            }
        }
    }

    checkInteractables() {
        this.game.shopHitbox.updateXY(
            370 + this.x - this.canvas.width / 2,
            this.game.shopHitbox.y
        );
        this.game.switchGameHitbox.updateXY(
            70 + this.x - this.canvas.width / 2,
            this.game.switchGameHitbox.y
        );
        if (
            this.game.switchGameHitbox.collidesWith(
                this.hitbox,
                this.game.showHitboxes,
                this.ctx
            )
        ) {
            this.game.canSwitch = true;
            this.game.showInterractable();
        } else if (
            this.game.shopHitbox.collidesWith(
                this.hitbox,
                this.game.showHitboxes,
                this.ctx
            )
        ) {
            this.game.canBuy = true;
            this.game.showInterractable();
        } else {
            this.game.canSwitch = false;
            this.game.canBuy = false;
        }
    }

    update(inAnimation = false) {
        // Update the player's position
        this.get_current_grid();
        // Check collision first, before any movement is applied
        const collided = this.check_collision();

        // Only apply movement if no collision occurred
        if (!collided) {
            this.move();
        }

        if (!inAnimation) {
            this.checkCollisionWithBlock();
            this.checkCollisionWithEnemy();
            this.checkInteractables();
        }
        this.applyGravity();
        this.game.updatePlayerSpeed();
        this.hitbox.updateXY(this.canvas.width / 2 + this.playerOffset, this.y);
        this.show_player();
        if (this.game.showHitboxes) {
            this.hitbox.showOutline(this.ctx);
        }
        this.redeemCoins();
    }
}
