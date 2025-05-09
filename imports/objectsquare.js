export class Hitbox2D {
    constructor(
        x,
        y,
        width,
        height,
        identifier = "",
        offsetTop = 0,
        offsetBottom = 0,
        offsetLeft = 0,
        offsetRight = 0
    ) {
        this.identifier = identifier;

        this.startwidth = width;
        this.startheight = height;

        this.offsetTop = offsetTop;
        this.offsetBottom = offsetBottom;
        this.offsetLeft = offsetLeft;
        this.offsetRight = offsetRight;

        this.x = x + this.offsetLeft,
        this.y = y + this.offsetTop,
        this.width = this.startwidth - this.offsetLeft - this.offsetRight,
        this.height = this.startheight - this.offsetTop - this.offsetBottom
    }

    // Check if this hitbox is colliding with another hitbox
    collidesWith(other, showHitbox = false, ctx = null) {
        if (showHitbox) {
            this.showOutline(ctx);
        }
        if (
            this.x + this.width > other.x &&
            this.x < other.x + other.width &&
            this.y + this.height > other.y &&
            this.y < other.y + other.height
        ) {
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
        } else {
            // No collision detected
            return false;
        }
    }
    showOutline(ctx) {
        // Displayes the hitbox for debugging purposes
        ctx.strokeStyle = "red";
        switch (this.identifier) {
            case "player":
                ctx.strokeStyle = "blue";
                break;
            case "enemy":
                ctx.strokeStyle = "red";
                break;
            case "item":
                ctx.strokeStyle = "yellow";
                break;
            case "grid_walkable":
                ctx.strokeStyle = "orange";
                break;
            case "grid_collidable":
                ctx.strokeStyle = "purple";
                break;
            default:
                ctx.strokeStyle = "green";
        }

        ctx.lineWidth = 3;
        ctx.strokeRect(
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
    updateXY(x, y) {
        // Updates the x and y position of the hitbox
        this.x = x + this.offsetLeft;
        this.y = y + this.offsetTop;
        this.width = this.startwidth - this.offsetLeft - this.offsetRight,
        this.height = this.startheight - this.offsetTop - this.offsetBottom
    }
}
