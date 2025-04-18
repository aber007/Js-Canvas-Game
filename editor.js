console.log("editor.js loaded");
let canvas = document.querySelector("canvas");

const block_type = {
    "-3": "grass",
    "-2": "dirt",
    "-1": "rock+grass",
    0: "rock",
    1: "water",
};
let numRows = 6;
let numCols = 12;
canvas.width = 1536;
const GRID_SIZE = canvas.width / numCols;
canvas.height = GRID_SIZE * numRows;

let img_nr = -3;
let edit_mode = false;

var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

let isDrawing = false;
let isDeleting = false;
let current_img = `img/tiles/sheet_${img_nr}.gif`;

export class ProcedualGeneration {
    constructor(xPos) {
        this.xPos = xPos;
        this.yPos = 5;
        this.maxY = 5;
        this.minY = 2;
    }
    newTile(ypos) {
        unload();
        this.xPos = 0;
        this.yPos = ypos;
        this.maxY = 5;
        this.minY = 2;
        this.columnQueue = [];
        for (let i = 0; i < numCols; i++) {
            this.next();
        }
        // Empty rest of the queue
        for (let i = 0; i < this.columnQueue.length; i++) {
            this.drawColumn(this.columnQueue[i]);
        }
        let tileFile = {};
        for (let row of grids) {
            for (let grid of row) {
                if (grid.type !== undefined) {
                    tileFile[grid.coord] = {
                        color: grid.color,
                        img: grid.img.src.substring(
                            grid.img.src.indexOf("img/tiles/")
                        ),
                        img2: "",
                        collidable: true,
                        walkable: getImgType(grid)[1],
                    };
                }
            }
        }
        return tileFile;
    }
    next() {
        this.yPos += this.getElevationChange();
        this.columnQueue.push([this.yPos, this.xPos]);
        if (this.columnQueue.length > 5) {
            this.drawColumn(this.columnQueue.shift());
            this.modifyColumnQueue();
        }
        this.xPos += 1;
    }
    modifyColumnQueue() {
        const possibleChanges = ["hole", "holer", "hill", "hiller"];
        if (Math.random() < 0.1) {
            const change =
                possibleChanges[
                    Math.floor(Math.random() * possibleChanges.length)
                ];
            const firsty = this.columnQueue[0][0];
            switch (change) {
                case "hole":
                    console.log("Hole");
                    this.columnQueue[2][0] = firsty;
                    this.columnQueue.splice(1, 1);

                    break;
                case "holer":
                    console.log("Holer");
                    this.columnQueue[3][0] = firsty;
                    this.columnQueue.splice(1, 2);
                    break;
                case "hill":
                    break;
                case "hiller":
                    break;
            }
        }
    }
    getElevationChange() {
        if (this.xPos === 0) {
            return 0;
        }
        if (Math.random() < 0.4) {
            if (Math.random() < 0.5) {
                if (this.yPos === this.maxY) {
                    return -1;
                } else {
                    return 1;
                }
            } else {
                if (this.yPos === this.minY) {
                    return 1;
                } else {
                    return -1;
                }
            }
        } else {
            // Move forward
            return 0;
        }
    }
    drawColumn(coord) {
        for (let i = coord[0]; i <= this.maxY; i++) {
            drawGrid(null, [i, coord[1]]);
        }
    }
}

function getImgType(grid) {
    // Check the nearby grids of their type
    let n = undefined;
    let s = undefined;
    let e = "side";
    let w = "side";
    let ne = "side";
    let nw = "side";
    try {
        n = grids[grid.coord[0] - 1][grid.coord[1]].type;
    } catch (e) {}
    try {
        s = grids[grid.coord[0] + 1][grid.coord[1]].type;
    } catch (e) {}
    try {
        e = grids[grid.coord[0]][grid.coord[1] + 1].type;
    } catch (e) {}
    try {
        w = grids[grid.coord[0]][grid.coord[1] - 1].type;
    } catch (e) {}
    try {
        ne = grids[grid.coord[0] - 1][grid.coord[1] + 1].type;
    } catch (e) {}
    try {
        nw = grids[grid.coord[0] - 1][grid.coord[1] - 1].type;
    } catch (e) {}

    if (n === undefined) {
        if (
            (e === grid.type || e == "side") &&
            (w === grid.type || w == "side")
        ) {
            return [`img/tiles/dynamic_tile_names/${grid.type}/top.gif`, true];
        } else if ((e === grid.type || e === "side") && w === undefined) {
            return [
                `img/tiles/dynamic_tile_names/${grid.type}/corner_left.gif`,
                true,
            ];
        } else if ((w === grid.type || w === "side") && e === undefined) {
            return [
                `img/tiles/dynamic_tile_names/${grid.type}/corner_right.gif`,
                true,
            ];
        } else {
            return [
                `img/tiles/dynamic_tile_names/${grid.type}/top_thin.gif`,
                true,
            ];
        }
    }
    if (n !== undefined) {
        if (
            (e === grid.type || e == "side") &&
            (w === grid.type || w == "side")
        ) {
            if (ne === undefined && nw === undefined) {
                return [
                    `img/tiles/dynamic_tile_names/${grid.type}/top.gif`,
                    false,
                ];
            } else if (nw === undefined) {
                return [
                    `img/tiles/dynamic_tile_names/${grid.type}/corner_inverse_left.gif`,
                    false,
                ];
            } else if (ne === undefined) {
                return [
                    `img/tiles/dynamic_tile_names/${grid.type}/corner_inverse_right.gif`,
                    false,
                ];
            } else {
                return [
                    `img/tiles/dynamic_tile_names/${grid.type}/bottom_1.gif`,
                    false,
                ];
            }
        } else if (
            (e === grid.type || e === "side") &&
            (w === undefined || w == "side")
        ) {
            if (ne === undefined) {
                return [
                    `img/tiles/dynamic_tile_names/${grid.type}/corner_side_inverse_right.gif`,
                    false,
                ];
            } else {
                return [
                    `img/tiles/dynamic_tile_names/${grid.type}/left.gif`,
                    false,
                ];
            }
        } else if (
            (w === grid.type || w === "side") &&
            (e === undefined || e == "side")
        ) {
            if (nw === undefined) {
                return [
                    `img/tiles/dynamic_tile_names/${grid.type}/corner_side_inverse_left.gif`,
                    false,
                ];
            } else {
                return [
                    `img/tiles/dynamic_tile_names/${grid.type}/right.gif`,
                    false,
                ];
            }
        } else {
            return [
                `img/tiles/dynamic_tile_names/${grid.type}/side_thin.gif`,
                false,
            ];
        }
    }
}

export function updateAllGrids(sendgrids = grids) {
    for (let row of sendgrids) {
        for (let grid of row) {
            if (grid.type !== undefined) {
                grid.img.src = getImgType(grid)[0];
                grid.img.onload = () => {
                    grid.draw();
                };
            }
        }
    }
}

function drawGrid(e = null, gridCoord = null) {
    let grid;
    if (!gridCoord) {
        let x = e.clientX - canvas.getBoundingClientRect().left;
        let y = e.clientY - canvas.getBoundingClientRect().top;
        grid = grids[Math.floor(y / GRID_SIZE)][Math.floor(x / GRID_SIZE)];
    } else {
        grid = grids[gridCoord[0]][gridCoord[1]];
    }
    grid.type = block_type[img_nr];
    let type = getImgType(grid);
    current_img = type[0];

    let save_img2_src = "";

    if (img_nr >= 2) {
        console.log("img_nr: " + img_nr);
        if (grid.img.src.includes("sheet_")) {
            save_img2_src = "img/tiles/" + grid.img.src.split("/").pop();
        }
    }

    grid.img.src = current_img;
    // Save the current grid
    let save_img_src = current_img;

    savefile[grid.coord] = {
        color: grid.color,
        img: save_img_src,
        img2: save_img2_src,
        collidable: true,
        walkable: type[1],
    };
    updateAllGrids();
}

function deleteGrid(e) {
    let x = e.clientX - canvas.getBoundingClientRect().left;
    let y = e.clientY - canvas.getBoundingClientRect().top;
    let grid = grids[Math.floor(y / GRID_SIZE)][Math.floor(x / GRID_SIZE)];

    grid.img.src = "";
    grid.img2.src = "";
    grid.type = undefined;
    grid.collidable = false;
    grid.walkable = false;

    delete savefile[grid.coord];

    // Clear the canvas section and redraw the default grid
    ctx.clearRect(grid.x, grid.y, grid.width, grid.height);
    updateAllGrids();
}
if (edit_mode) {
    addEventListener("keydown", (e) => {
        if (e.key == "e") {
            edit();
        }
        if (e.key == "s") {
            save();
        }
        if (e.key == "l") {
            load();
        }
        if (e.key == "u") {
            unload();
        }
    });
}

class Grid {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.relativex = x;
        this.width = GRID_SIZE;
        this.height = GRID_SIZE;
        this.coord = [Math.floor(y / GRID_SIZE), Math.floor(x / GRID_SIZE)];
        this.color = color;
        this.type = undefined;
        this.collidable = false;
        this.walkable = false;
        this.img = new Image();
        this.img2 = new Image();
        this.back_img = new Image();
        this.img.src = "";
        this.img2.src = "";
        this.back_img.src = "";

        this.outline = "none";
        if (edit_mode) {
            this.draw();
        }
    }

    draw(offset = 0) {
        if (this.img.src && edit_mode) {
            if (this.img2.src != "") {
                ctx.drawImage(
                    this.img2,
                    this.x + offset,
                    this.y,
                    this.width,
                    this.height
                );
            }
            if (this.img.src.split(".").pop() == "png") {
                ctx.drawImage(
                    this.img,
                    this.x + offset + GRID_SIZE,
                    canvas.height / 2 + canvas.height / 6,
                    this.width * 2,
                    this.height * 3.5
                );
            } else {
                ctx.drawImage(
                    this.img,
                    this.x + offset,
                    this.y,
                    this.width,
                    this.height
                );
            }
            // Draw the outline
            if (this.outline != "none") {
                ctx.beginPath();
                ctx.rect(this.x + offset, this.y, this.width, this.height);
                ctx.strokeStyle = this.outline;
                ctx.stroke();
                ctx.closePath();
            }
        } else {
            // Do nothing
        }
    }
}

// Create a 2D array for grids
let grids = [];
function createGrids() {
    grids = [];
    for (let j = 0; j < numRows; j++) {
        // Rows
        let row = []; // Create a new row
        for (let i = 0; i < numCols; i++) {
            // Columns
            let x = i * GRID_SIZE;
            let y = j * GRID_SIZE;
            row.push(new Grid(x, y, "lightblue")); // Add each Grid to the current row
        }
        grids.push(row); // Add the row to the grids array
    }
}
createGrids();

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
export function unload() {
    // Clear the canvas section and redraw the default grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    savefile = {}; // Clear the savefile object
    createGrids(); // Recreate the grids
}

export function load(texture_nr = null, offset = 0) {
    if (texture_nr !== null) {
        // Automatically load the specified texture file
        let fileName = `img/textures/texture${texture_nr}.json`;

        // Use fetch or an equivalent method to load the JSON file
        fetch(fileName)
            .then((response) => {
                if (!response.ok)
                    throw new Error(`Failed to load file: ${fileName}`);
                return response.json();
            })
            .then((data) => {
                applyTextureData(data, offset); // Apply the loaded texture data to the grid
                console.log(`Successfully loaded ${fileName}`);
            })
            .catch((err) => {
                console.log(`Error: ${err}`);
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
export function applyTextureData(data, offset) {
    for (let key in data) {
        let [row, col] = key.split(",").map(Number); // Parse grid coordinates
        let grid = grids[row][col + offset];
        if (grid) {
            grid.img.src = data[key].img || "";
            grid.img.onload = () => grid.draw();
            grid.img2.src = data[key].img2 || "";
            grid.collidable = data[key].collidable || false;
            grid.walkable = data[key].walkable || false;

            if (
                data[key].walkable &&
                grid.img.src.includes("sheet_") &&
                grid.x > canvas.width / 2
            ) {
                // Chance to add a block at that row
                if (Math.random() < 0.1) {
                    // Decide color of block (value)
                    let color = "gray";
                    const value = Math.random();
                    if (value < 0.05) {
                        color = "blue";
                    } else if (value < 0.3) {
                        color = "yellow";
                    }
                    console.log("Grid: " + grid.coord + " is walkable");
                    // add outline
                    game.blocks.push(
                        new Block(
                            grid.x - canvas.width / 2 + 48,
                            grid.y - 32,
                            32,
                            32,
                            color
                        )
                    );
                }
            }
        } else {
            // Create a new grid if it doesn't exist
            let x = (col + offset) * GRID_SIZE;
            let y = row * GRID_SIZE;
            grid = new Grid(x, y, "lightblue");
            grid.coord = [row, col + offset];
            grid.img.src = data[key].img || "";
            grid.img.onload = () => grid.draw();
            grid.img2.src = data[key].img2 || "";
            grid.collidable = data[key].collidable || false;
            grid.walkable = data[key].walkable || true;
            grid.type = block_type[img_nr];
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
                    let x = row.length * GRID_SIZE;
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
        addEventListener("mousemove", (e) => {
            lastMouseX = e.clientX - canvas.getBoundingClientRect().left;
            lastMouseY = e.clientY - canvas.getBoundingClientRect().top;
        });

        // Listen for keydown events
        addEventListener("keydown", (e) => {
            // Calculate grid position based on the last mouse position
            let gridX = Math.floor(lastMouseY / GRID_SIZE);
            let gridY = Math.floor(lastMouseX / GRID_SIZE);

            let grid = grids[gridX][gridY];
            if (!grid) return; // Ensure the grid cell exists

            // Toggle properties based on the key pressed
            if (e.key == "c") {
                grid.collidable = !grid.collidable;
                console.log(savefile);
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
            if (e.key == "g") {
                procedual.newTile(5);
            }
        });

        canvas.addEventListener("mousedown", (e) => {
            if (e.button === 0) {
                // Left button
                console.log(savefile);
                isDrawing = true;
                drawGrid(e);
            } else if (e.button === 2) {
                // Right button
                isDeleting = true;
                deleteGrid(e);
            }
        });

        let lastGridX = -1;
        let lastGridY = -1;

        canvas.addEventListener("mousemove", (e) => {
            if (isDrawing) {
                let x = Math.floor(
                    (e.clientX - canvas.getBoundingClientRect().left) /
                        GRID_SIZE
                );
                let y = Math.floor(
                    (e.clientY - canvas.getBoundingClientRect().top) / GRID_SIZE
                );

                if (x !== lastGridX || y !== lastGridY) {
                    lastGridX = x;
                    lastGridY = y;
                    drawGrid(e);
                }
            } else if (isDeleting) {
                let x = Math.floor(
                    (e.clientX - canvas.getBoundingClientRect().left) /
                        GRID_SIZE
                );
                let y = Math.floor(
                    (e.clientY - canvas.getBoundingClientRect().top) / GRID_SIZE
                );

                if (x !== lastGridX || y !== lastGridY) {
                    lastGridX = x;
                    lastGridY = y;
                    deleteGrid(e);
                }
            }
        });

        canvas.addEventListener("mouseup", () => {
            isDrawing = false;
            isDeleting = false;
        });

        canvas.addEventListener("mouseleave", () => {
            isDrawing = false;
            isDeleting = false;
        });

        canvas.addEventListener("contextmenu", (e) => {
            e.preventDefault(); // Prevent the default context menu
        });

        // Change current img with scroll
        addEventListener("wheel", (e) => {
            if (e.deltaY > 0) {
                if (img_nr == 1) return;
                img_nr++;
            } else {
                if (img_nr == -3) return;
                img_nr--;
            }
            // Display the current img
            const grid = grids[0][0];
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
        removeEventListener("mousemove", () => {});
        removeEventListener("mouseup", () => {});
        removeEventListener("mouseleave", () => {});
        removeEventListener("contextmenu", () => {});
        removeEventListener("wheel", () => {});
    }
}
const procedual = new ProcedualGeneration(0);
