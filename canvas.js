console.log('canvas.js loaded');
let canvas = document.querySelector('canvas');

canvas.width = 768 * 2;
canvas.height = 512 * 1.5;

let img_nr = 2;
let edit_mode = false;

var ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

class Grid {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = 32 * 4;
        this.height = 32 * 4;
        this.coord = [Math.floor(y / 32 / 4), Math.floor(x / 32 / 4)];
        this.color = color;
        this.collidable = true;
        this.walkable = true;
        this.img = new Image();
        this.img2 = new Image();
        this.draw();
    }

    draw(color = this.color) {
        if (this.img.src) {
            if (this.img2.src) {
                ctx.drawImage(this.img2, this.x, this.y, this.width, this.height);
            }
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } else {
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = color;
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
        row.push(new Grid(x, y, 'lightblue')); // Add each Grid to the current row
    }
    grids.push(row); // Add the row to the grids array
}

// Edit mode
let savefile = {}
function save() {
    if (edit_mode){
        let data = JSON.stringify(savefile);
        let blob = new Blob([data], {type: 'application/json'});
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'texture.json';
        a.click();
        URL.revokeObjectURL(url);
    } else {
        alert('There is nothing to save');
    }
}
function unload() {
    // Clear the canvas section and redraw the default grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);



}

function load(texture_nr = null, offset = 0) {
    if (texture_nr !== null) {
        // Automatically load the specified texture file
        let fileName = `img/textures/texture${texture_nr}.json`;

        // Use fetch or an equivalent method to load the JSON file
        fetch(fileName)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load file: ${fileName}`);
                return response.json();
            })
            .then(data => {
                applyTextureData(data, offset); // Apply the loaded texture data to the grid
                console.log(`Successfully loaded ${fileName}`);
            })
            .catch(err => {
                alert(`Error: ${err.message}`);
            });
    } else {
        // Allow the user to select a file manually
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
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
                    alert('Failed to load file: ' + err.message);
                }
            };
        };
        input.click();
    }
}

// Helper function to apply the loaded data to the grid
function applyTextureData(data, offset) {
    unload(); // Clear the canvas section and redraw the default grid
    console.log(data);
    for (let key in data) {
        let [row, col] = key.split(',').map(Number); // Parse grid coordinates
        let grid = grids[row][col + offset];
        if (grid) {
            grid.img.src = data[key].img || '';
            grid.img.onload = () => grid.draw();
            grid.img2.src = data[key].img2 || '';
            grid.collidable = data[key].collidable || false;
            grid.walkable = data[key].walkable || true;
        }
    }
    savefile = data; // Update the global savefile variable
}

function edit() {
    edit_mode = !edit_mode;
    if (edit_mode) {
        console.log('Edit mode enabled');
        canvas.style.cursor = 'crosshair';
        // Adjust collision and walkable properties with keys 
        let lastMouseX = 0; // Track the last mouse X position
        let lastMouseY = 0; // Track the last mouse Y position

        // Track mouse movement over the canvas
        canvas.addEventListener('mousemove', (e) => {
            lastMouseX = e.clientX - canvas.getBoundingClientRect().left;
            lastMouseY = e.clientY - canvas.getBoundingClientRect().top;
        });

        // Listen for keydown events
        addEventListener('keydown', (e) => {
            // Calculate grid position based on the last mouse position
            let gridX = Math.floor(lastMouseY / 32 / 4);
            let gridY = Math.floor(lastMouseX / 32 / 4);

            let grid = grids[gridX][gridY];
            if (!grid) return; // Ensure the grid cell exists

            // Toggle properties based on the key pressed
            if (e.key == 'c') {
                grid.collidable = !grid.collidable;
                savefile[grid.coord].collidable = grid.collidable;
                console.log("Collision is: " + grid.collidable);
            }
            if (e.key == 'w') {
                grid.walkable = !grid.walkable;
                savefile[grid.coord].walkable = grid.walkable;
                console.log("Walkable is: " + grid.walkable);
            }
        });


        addEventListener('mousedown', (e) => {
            if (e.button != 0) return; // Only left
            let x = e.clientX - canvas.getBoundingClientRect().left;
            let y = e.clientY - canvas.getBoundingClientRect().top;
            let grid = grids[Math.floor(y / 32 / 4)][Math.floor(x / 32 / 4)];
            let current_img = `img/tiles/sheet_${img_nr}.gif`;
            grid.img.src = current_img;

            
            
            
            grid.img.onload = () => {
                grid.draw();
            };
            // Save the current grid
            let img_name = current_img.split('/')[2];
            let save_img_src = "img/tiles/" + img_name;
            
            savefile[grid.coord] = {color: grid.color, img: save_img_src, img2: "", collidable: grid.collidable, walkable: grid.walkable};
        });
        addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent the default context menu
            let x = e.clientX - canvas.getBoundingClientRect().left;
            let y = e.clientY - canvas.getBoundingClientRect().top;
            let grid = grids[Math.floor(y / 32 / 4)][Math.floor(x / 32 / 4)];
        
            grid.img.src = ''; 
            grid.img2.src = '';

            delete savefile[grid.coord];


        
            // Clear the canvas section and redraw the default grid
            ctx.clearRect(grid.x, grid.y, grid.width, grid.height);
            grid.draw(color = grid.color); // Redraw the default grid color
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
            let current_img = `img/tiles/sheet_${img_nr}.gif`;
            grid.img.src = current_img;
            grid.img.onload = () => {
                grid.draw();
            };
        });

    } else {
        console.log('Edit mode disabled');
        console.log(savefile);
        canvas.style.cursor = 'default';
        removeEventListener('mousedown', () => {});
        removeEventListener('contextmenu', () => {});
        removeEventListener('wheel', () => {});
    }
}