export class Hitbox2D {
    constructor(x, y, width, height, identifier = "") {
        this.identifier = identifier;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    // Check if this hitbox is colliding with another hitbox
    collidesWith(other) {
        if (
            (this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y)
        ) {
            console.log(this.identifier, "collides with", other.identifier);
            // Collision detected
            // Find the direction of the collision
            const dx = Math.abs(this.x - other.x);
            const dy = Math.abs(this.y - other.y);
            const overlapX = this.width + other.width - dx;
            const overlapY = this.height + other.height - dy;
            if (overlapX < overlapY) {
                // Collision is more horizontal than vertical
                if (this.x < other.x) {
                    return "left"; // Move left
                } else {
                    return "right"; // Move right
                }
            } else {
                // Collision is more vertical than horizontal
                if (this.y < other.y) {
                    return "up"; // Move up
                } else {
                    return "down"; // Move down
                }
            }
        }
    }
    showOutline(ctx) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    updateXY(x, y) {
        this.x = x;
        this.y = y;
    }
}