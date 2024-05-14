const fs = require("fs");

function save(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, "\t"));
}

function randomInteger(min, max) {
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

module.exports = {
    save,
    randomInteger
};
