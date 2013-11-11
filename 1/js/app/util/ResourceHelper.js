define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "app/util/StoredData"
], function (declare, lang, StoredData) {
    return declare("app.util.ResourceRedisHelper", null, {
        app: null,
        redisClient: null,
        storedData: new StoredData({
            storeLabel: "Resource",
            storeIdentifier: "who"
        }),
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);
        },
        handleIAm: function (req) {
            if (this.redisClient == null) {
                this.handleIAm_StoredData(req);
            }
            else {
                this.handleIAm_Redis(req);
            }
        },
        handleIAmNoMore: function (req) {
            if (this.redisClient == null) {
                this.handleIAmNoMore_StoredData(req);
            }
            else {
                this.handleIAmNoMore_Redis(req);
            }
        },
        handleHeartbeat: function (req) {
            if (this.redisClient == null) {
                this.handleHeartbeat_StoredData(req);
            }
            else {
                this.handleHeartbeat_Redis(req);
            }
        },
        handleTellOther: function (req) {
            if (this.redisClient == null) {
                this.handleTellOther_StoredData(req);
            }
            else {
                this.handleTellOther_Redis(req);
            }
        },
        handleTellSomeone: function (req) {
            if (this.redisClient == null) {
                this.handleTellSomeone_StoredData(req);
            }
            else {
                this.handleTellSomeone_Redis(req);
            }
        },
        handleWhoAreThere: function (req) {
            if (this.redisClient == null) {
                this.handleWhoAreThere_StoredData(req);
            }
            else {
                this.handleWhoAreThere_Redis(req);
            }
        },
        handleIAm_StoredData: function (req) {
            if (this.storedData.store.get(req.data.whoAmI) != null) {
                req.io.respond({
                    status: false,
                    message: "'(" + req.data.who + ") i.am (" + req.data.whoAmI + ")' not accepted"
                });
            }
            else {
                req.io.respond({
                    status: true,
                    message: "'(" + req.data.who + ") i.am (" + req.data.whoAmI + ")' accepted"
                });

                this.storedData.store.put({
                    "who": req.data.whoAmI,
                    "when": req.data.when
                });

                req.io.join(req.data.whoAmI);

                if (this.storedData.store.get("Resource Monitor") != null) {
                    this.app.io.room("Resource Monitor").broadcast("someone.joined", {
                        who: req.data.whoAmI,
                        when: req.data.when
                    });
                }

                req.io.broadcast("he.is", {
                    who: req.data.whoAmI,
                    when: req.data.when
                });

                req.io.emit("you.are", {
                    who: req.data.whoAmI,
                    when: req.data.when
                });
            }
        },
        handleIAm_Redis: function (req) {
            this.redisClient.hget("Resource", req.data.whoAmI, lang.hitch(this, function (error, result) {
                if (error != null || result == null) {
                    req.io.respond({
                        status: true,
                        message: "'(" + req.data.who + ") i.am (" + req.data.whoAmI + ")' accepted"
                    });

                    this.redisClient.hset("Resource", req.data.whoAmI, JSON.stringify({
                        "who": req.data.whoAmI,
                        "when": req.data.when
                    }));

                    req.io.join(req.data.whoAmI);

                    this.redisClient.hget("Resource", "Resource Monitor", lang.hitch(this, function (error, result) {
                        if (error == null && result != null) {
                            this.app.io.room("Resource Monitor").broadcast("someone.joined", {
                                who: req.data.whoAmI,
                                when: req.data.when
                            });
                        }
                    }));

                    req.io.broadcast("he.is", {
                        who: req.data.whoAmI,
                        when: req.data.when
                    });

                    req.io.emit("you.are", {
                        who: req.data.whoAmI,
                        when: req.data.when
                    });
                }
                else {
                    req.io.respond({
                        status: false,
                        message: "'(" + req.data.who + ") i.am (" + req.data.whoAmI + ")' not accepted"
                    });
                }
            }));
        },
        handleIAmNoMore_StoredData: function (req) {
            if (this.storedData.store.get(req.data.whoAmI) == null) {
                req.io.respond({
                    status: false,
                    message: "'(" + req.data.who + ") i.am.no.more (" + req.data.whoAmI + ")' not accepted"
                });
            }
            else {
                req.io.respond({
                    status: true,
                    message: "'(" + req.data.who + ") i.am.no.more (" + req.data.whoAmI + ")' accepted"
                });

                this.storedData.store.remove(req.data.whoAmI);

                req.io.leave(req.data.whoAmI);

                if (this.storedData.store.get("Resource Monitor") != null) {
                    this.app.io.room("Resource Monitor").broadcast("someone.left", {
                        who: req.data.whoAmI,
                        when: req.data.when
                    });
                }

                req.io.broadcast("he.is.no.more", {
                    who: req.data.whoAmI,
                    when: req.data.when
                });

                req.io.emit("you.are.no.more", {
                    who: req.data.whoAmI,
                    when: req.data.when
                });
            }
        },
        handleIAmNoMore_Redis: function (req) {
            this.redisClient.hget("Resource", req.data.whoAmI, lang.hitch(this, function (error, result) {
                if (error != null || result == null) {
                    req.io.respond({
                        status: false,
                        message: "'(" + req.data.who + ") i.am.no.more (" + req.data.whoAmI + ")' not accepted"
                    });
                }
                else {
                    req.io.respond({
                        status: true,
                        message: "'(" + req.data.who + ") i.am.no.more (" + req.data.whoAmI + ")' accepted"
                    });

                    this.redisClient.hdel("Resource", req.data.whoAmI);

                    req.io.leave(req.data.whoAmI);

                    this.redisClient.hget("Resource", "Resource Monitor", lang.hitch(this, function (error, result) {
                        if (error == null && result != null) {
                            this.app.io.room("Resource Monitor").broadcast("someone.left", {
                                who: req.data.whoAmI,
                                when: req.data.when
                            });
                        }
                    }));

                    req.io.broadcast("he.is.no.more", {
                        who: req.data.whoAmI,
                        when: req.data.when
                    });

                    req.io.emit("you.are.no.more", {
                        who: req.data.whoAmI,
                        when: req.data.when
                    });
                }
            }));
        },
        handleHeartbeat_StoredData: function (req) {
            req.io.respond({
                status: true,
                message: "'(" + req.data.who + ") heartbeat' accepted"
            });

            if (this.storedData.store.get(req.data.who) != null) {
                this.storedData.store.get(req.data.who).when = req.data.when;
            }

            if (this.storedData.store.get("Resource Monitor") != null) {
                this.app.io.room("Resource Monitor").broadcast("someone.beat", {
                    who: req.data.who,
                    when: req.data.when
                });
            }
        },
        handleHeartbeat_Redis: function (req) {
            req.io.respond({
                status: true,
                message: "'(" + req.data.who + ") heartbeat' accepted"
            });

            this.redisClient.hget("Resource", req.data.who, lang.hitch(this, function (error, result) {
                if (error == null && result != null) {
                    var resultInJson = JSON.parse(result);

                    resultInJson.when = req.data.when;
                    this.redisClient.set(req.data.who, JSON.stringify(resultInJson));
                }
            }));

            this.redisClient.hget("Resource", "Resource Monitor", lang.hitch(this, function (error, result) {
                if (error == null && result != null) {
                    this.app.io.room("Resource Monitor").broadcast("someone.beat", {
                        who: req.data.who,
                        when: req.data.when
                    });
                }
            }));
        },
        handleTellOther_StoredData: function (req) {
            req.io.respond({
                status: true,
                message: "'(" + req.data.who + ") tell.other' accepted"
            });

            req.io.broadcast("someone.said", {
                who: req.data.who,
                what: req.data.what,
                when: req.data.when
            });
        },
        handleTellOther_Redis: function (req) {
            req.io.respond({
                status: true,
                message: "'(" + req.data.who + ") tell.other' accepted"
            });

            req.io.broadcast("someone.said", {
                who: req.data.who,
                what: req.data.what,
                when: req.data.when
            });
        },
        handleTellSomeone_StoredData: function (req) {
            if (this.storedData.store.get(req.data.whom) == null) {
                req.io.respond({
                    status: false,
                    message: "'(" + req.data.who + ") tell.someone (" + req.data.whom + ")' not accepted"
                });
            }
            else {
                req.io.respond({
                    status: true,
                    message: "'(" + req.data.who + ") tell.someone (" + req.data.whom + ")' accepted"
                });

                this.app.io.room(req.data.whom).broadcast("someone.said", {
                    who: req.data.who,
                    what: req.data.what,
                    when: req.data.when
                });
            }
        },
        handleTellSomeone_Redis: function (req) {
            this.redisClient.hget("Resource", req.data.whom, lang.hitch(this, function (error, result) {
                if (error != null || result == null) {
                    req.io.respond({
                        status: false,
                        message: "'(" + req.data.who + ") tell.someone (" + req.data.whom + ")' not accepted"
                    });
                }
                else {
                    req.io.respond({
                        status: true,
                        message: "'(" + req.data.who + ") tell.someone (" + req.data.whom + ")' accepted"
                    });

                    this.app.io.room(req.data.whom).broadcast("someone.said", {
                        who: req.data.who,
                        what: req.data.what,
                        when: req.data.when
                    });
                }
            }));
        },
        handleWhoAreThere_StoredData: function (req) {
            req.io.respond({
                status: true,
                message: "'(" + req.data.who + ") who.are.there' accepted"
            });

            req.io.emit("there.are", {
                who: this.storedData.store.query({})
            });
        },
        handleWhoAreThere_Redis: function (req) {
            req.io.respond({
                status: true,
                message: "'(" + req.data.who + ") who.are.there' accepted"
            });

            this.redisClient.hvals("Resource", lang.hitch(this, function (error, result) {
                if (error == null && result != null) {
                    var items = [];

                    for (var key in result) {
                        try {
                            items.push(JSON.parse(result[key]));
                        }
                        catch (e) {
                        }
                    }

                    req.io.emit("there.are", {
                        who: items
                    });
                }
            }));
        }
    });
});
