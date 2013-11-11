try {
    var net = require("net");

    if (typeof process.env.NODE_ENV == "undefined") {
        process.env.NODE_ENV = "development";
    }

    if (typeof process.stdout == "undefined") {
        process.stdout = new net.Socket();
    }

    if (typeof process.argv == "undefined") {
        process.argv = ["node.exe", __filename];
    }

    require("./js/config.js");
    require("./js/dojo/dojo-release-1.9.1-src/dojo/dojo.js");

    global.require([
        "root/main"
    ], function (main) {
        main(__dirname);
    });
}
catch (e) {
    console.log("Exception: " + e.stack);
}