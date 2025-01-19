console.log('canvas.js loaded');
let canvas = document.querySelector('canvas');

canvas.width = 768 * 2;
canvas.height = 512 * 1.5;

let img_nr = 2;

var ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

class Grid {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = 32 * 4;
        this.height = 32 * 4;
        this.coord = [Math.floor(x / 32 / 4), Math.floor(y / 32 / 4)];
        this.color = color;
        this.collidable = true;
        this.walkable = true;
        this.img = new Image();
        this.draw();
    }

    draw() {
        if (this.img.src) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } else {
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
    }
}

// Create a 2D array for grids
let grids = [];
for (let j = 0; j < 8; j++) { // Rows
    let row = []; // Create a new row
    for (let i = 0; i < 12; i++) { // Columns
        let x = i * 32 * 4;
        let y = j * 32 * 4;
        row.push(new Grid(x, y, 'white')); // Add each Grid to the current row
    }
    grids.push(row); // Add the row to the grids array
}

// Draw the images
addEventListener('mousedown', (e) => {
    if (e.button != 0) return; // Only left
    let x = e.clientX - canvas.getBoundingClientRect().left;
    let y = e.clientY - canvas.getBoundingClientRect().top;
    let grid = grids[Math.floor(y / 32 / 4)][Math.floor(x / 32 / 4)];
    console.log("Clicked on grid: ", grid.coord);
    let current_img = `img/sheet_${img_nr}.gif`;

    grid.img.src = current_img;
    grid.img.onload = () => {
        grid.draw();
    };
});
addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Prevent the default context menu
    let x = e.clientX - canvas.getBoundingClientRect().left;
    let y = e.clientY - canvas.getBoundingClientRect().top;
    let grid = grids[Math.floor(y / 32 / 4)][Math.floor(x / 32 / 4)];
    console.log("Right-clicked on grid: ", grid.coord);

    grid.img.src = ''; 

    // Clear the canvas section and redraw the default grid
    ctx.clearRect(grid.x, grid.y, grid.width, grid.height);
    grid.draw(); // Redraw the default grid color
});

// Change current img with scroll
addEventListener('wheel', (e) => {
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
    let current_img = `img/sheet_${img_nr}.gif`;
    grid.img.src = current_img;
    grid.img.onload = () => {
        grid.draw();
    };
});