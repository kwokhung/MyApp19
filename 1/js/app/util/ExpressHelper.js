define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/node!util"
], function (declare, lang, util) {
    return declare("app.util.ExpressHelper", null, {
        appDirName: null,
        app: null,
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);
        },
        handleIndex: function (req, res) {
            res.sendfile(this.appDirName + "/index.html");
        },
        handleProcess: function (req, res) {
            res.send(util.inspect(process, { showHidden: false, depth: 2 }));
        },
        ioConfigure: function () {
            switch (process.env.NODE_ENV) {
                case "production":
                    this.app.io.set("transports", [
                        //"websocket",
                        //"flashsocket",
                        "htmlfile",
                        "xhr-polling",
                        "jsonp-polling"
                    ]);

                    break;

                default:
                    this.app.io.set("transports", [
                        "websocket",
                        "flashsocket",
                        "htmlfile",
                        "xhr-polling",
                        "jsonp-polling"
                    ]);

                    break;
            }
        },
        ioSetAuthorization: function (handshakeData, accept) {
            return accept(null, true);
        },
        ioOnConnection: function (socket) {
            var heartbeat = setInterval(function () {
                socket.emit("heartbeat", {
                    when: new Date().yyyyMMddHHmmss()
                });
            }, 60000)

            socket.on("disconnect", function () {
                clearInterval(heartbeat);
            })
        }
    });
});
