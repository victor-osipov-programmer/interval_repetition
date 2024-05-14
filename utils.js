const fs = require("fs");

async function save(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, "\t"));
}

module.exports = {
    save,
};
