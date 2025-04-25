const fs = require("fs");
const path = require("path");

const folderPath = path.join("./img/enemy2/bunny/");

fs.readdir(folderPath, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    files.forEach((file, index) => {
        const oldPath = path.join(folderPath, file);
        const newPath = path.join(folderPath, `bunny_${index + 1}.gif`);

        fs.rename(oldPath, newPath, (err) => {
        if (err) {
            console.error(err);
            return;
        }

        console.log(`${file} has been renamed to tile_${index + 1}.gif`);
        });
    });
});