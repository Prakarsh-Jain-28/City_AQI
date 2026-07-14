const fs = require("fs/promises");

function logReqRes(filename) {

    return async (req, res, next) => {
        try {
            const url = req.body ? req.body.url : "";
            await fs.appendFile(
                filename,
                `${Date.now()}: ${req.method}: ${req.path}: ${url}\n`
            );
        } catch (err) {
            console.error(err);
        }

        next();
    };
}

module.exports = logReqRes;
