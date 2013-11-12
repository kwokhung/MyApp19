define([
    "dojo/_base/lang",
    "dojo/node!util",
    "dojo/node!express.io",
    "dojo/node!connect-ensure-login",
    "dojo/node!passport",
    "dojo/node!passport-local",
    "dojo/node!passport-http",
    "dojo/node!passport-oauth2-client-password",
    "dojo/node!passport-http-bearer",
    "dojo/node!oauth2orize",
    "app/util/AppHelper",
    "app/util/ExpressHelper",
    "app/util/GeneralHelper",
    "app/util/UserStore",
    "app/util/ClientStore",
    "app/util/CodeStore",
    "app/util/TokenStore"
], function (lang, util, express, connectEnsureLogin, passport, passportLocal, passportHttp, passportOauth2ClientPassword, passportHttpBearer, oauth2orize, AppHelper, ExpressHelper, GeneralHelper, UserStore, ClientStore, CodeStore, TokenStore) {
    return function (appDirName) {
        var appHelper = new AppHelper();

        appHelper.initApp();

        var app = express();

        var expressHelper = new ExpressHelper({
            appDirName: appDirName,
            app: app
        });

        var generalHelper = new GeneralHelper();

        var userStore = new UserStore();
        var clientStore = new ClientStore();
        var codeStore = new CodeStore();
        var tokenStore = new TokenStore();

        var oauthServer = oauth2orize.createServer();

        oauthServer.serializeClient(function (client, done) {
            return done(null, client.id);
        });

        oauthServer.deserializeClient(function (id, done) {
            clientStore.find(id, function (error, client) {
                if (error) {
                    return done(error);
                }
                else {
                    return done(null, client);
                }
            });
        });

        oauthServer.grant(oauth2orize.grant.code(function (client, redirectURI, user, ares, done) {
            var code = generalHelper.uid(16)

            codeStore.save(code, client.id, redirectURI, user.id, ares.scope, function (error) {
                if (error) {
                    return done(error);
                }
                else {
                    done(null, code);
                }
            });
        }));

        oauthServer.exchange(oauth2orize.exchange.code(function (client, code, redirectURI, done) {
            codeStore.find(code, function (error, authCode) {
                if (error) {
                    return done(error);
                }
                else if (authCode === undefined) {
                    return done(null, false);
                }
                else if (client.id !== authCode.clientID) {
                    return done(null, false);
                }
                else if (redirectURI !== authCode.redirectURI) {
                    return done(null, false);
                }
                else {
                    codeStore.delete(code, function (error) {
                        if (error) {
                            return done(error);
                        }
                        else {
                            var token = generalHelper.uid(256);

                            tokenStore.save(token, authCode.userID, authCode.clientID, authCode.scope, function (error) {
                                if (error) {
                                    return done(error);
                                }
                                else {
                                    done(null, token);
                                }
                            });
                        }
                    });
                }
            });
        }));

        passport.serializeUser(function (user, done) {
            done(null, user.id);
        });

        passport.deserializeUser(function (id, done) {
            userStore.find(id, function (error, user) {
                done(error, user);
            });
        });

        var LocalStrategy = passportLocal.Strategy;

        passport.use(new LocalStrategy({
            usernameField: "username",
            passwordField: "password"
        }, function (username, password, done) {
            userStore.findByUsername(username, function (error, user) {
                if (error) {
                    return done(error);
                }
                else if (!user) {
                    return done(null, false, {
                        message: "Unknown user: " + username
                    });
                }
                else if (user.password != password) {
                    return done(null, false, {
                        message: "Invalid password: " + username
                    });
                }
                else {
                    return done(null, user);
                }
            });
        }));

        var BasicStrategy = passportHttp.BasicStrategy;

        passport.use(new BasicStrategy(function (username, password, done) {
            clientStore.findByClientId(username, function (error, client) {
                if (error) {
                    return done(error);
                }
                else if (!client) {
                    return done(null, false);
                }
                else if (client.clientSecret != password) {
                    return done(null, false);
                }
                else {
                    return done(null, client);
                }
            });
        }));

        var ClientPasswordStrategy = passportOauth2ClientPassword.Strategy;

        passport.use(new ClientPasswordStrategy(function (clientId, clientSecret, done) {
            clientStore.findByClientId(clientId, function (error, client) {
                if (error) {
                    return done(error);
                }
                else if (!client) {
                    return done(null, false);
                }
                else if (client.clientSecret != clientSecret) {
                    return done(null, false);
                }
                else {
                    return done(null, client);
                }
            });
        }));

        var BearerStrategy = passportHttpBearer.Strategy;

        passport.use(new BearerStrategy(function (accessToken, done) {
            tokenStore.find(accessToken, function (error, token) {
                if (error) {
                    return done(error);
                }
                else if (!token) {
                    return done(null, false);
                }
                else {
                    userStore.find(token.userID, function (error, user) {
                        if (error) {
                            return done(error);
                        }
                        else if (!user) {
                            return done(null, false);
                        }
                        else {
                            var info = {
                                scope: token.scope
                            }

                            done(null, user, info);
                        }
                    });
                }
            });
        }));

        app.configure(function () {
            app.set("view engine", "ejs");
            app.use(express.logger());
            app.use(express.cookieParser());
            app.use(express.bodyParser());
            app.use(express.session({
                secret: "something",
                store: new express.session.MemoryStore
            }));
            app.use(passport.initialize());
            app.use(passport.session());
            app.use(app.router);
            app.use("/www", express.static(appDirName + "/www"));
            app.use(express.errorHandler({
                dumpExceptions: true,
                showStack: true
            }));
        });

        app.get("/index.html", lang.hitch(expressHelper, expressHelper.handleIndex));

        app.get("/process", lang.hitch(expressHelper, expressHelper.handleProcess));

        app.get("/", function (req, res) {
            res.send("OAuth 2.0 Server");
        });

        app.get("/user/login", function (req, res) {
            res.render("login");
        });

        app.get("/user/logout", function (req, res) {
            req.logout();
            res.redirect("/");
        });

        app.get("/user/account", connectEnsureLogin.ensureLoggedIn("/user/login"), function (req, res) {
            res.render("account", {
                user: req.user
            });
        });

        app.get("/user/authorize", connectEnsureLogin.ensureLoggedIn("/user/login"), oauthServer.authorization(function (clientID, redirectURI, done) {
            clientStore.findByClientId(clientID, function (error, client) {
                if (error) {
                    return done(error);
                }
                else {
                    return done(null, client, redirectURI);
                }
            });
        }), function (req, res) {
            res.render("authorize", {
                transactionID: req.oauth2.transactionID,
                user: req.user,
                client: req.oauth2.client,
                scope: req.oauth2.req.scope
            });
        });

        app.get("/api/userinfo", passport.authenticate("bearer", {
            session: false
        }), function (req, res) {
            if (req.authInfo.scope.indexOf("http://localhost:3100/api/userinfo") == -1) {
                res.writeHead(401);
                res.end("Out of scope");
            }
            else {
                res.json({
                    user_id: req.user.id,
                    name: req.user.name,
                    scope: req.authInfo.scope
                })
            }
        });

        app.post("/user/login", function (req, res, next) {
            passport.authenticate("local", function (error, user, info) {
                if (error) {
                    return next(error);
                }
                else if (!user) {
                    if (info) {
                        req.session.messages = [
                            info.message
                        ];
                    }

                    return res.redirect("/user/login");
                }
                else {
                    req.logIn(user, function (error) {
                        if (error) {
                            return next(error);
                        }
                        else {
                            next();
                        }
                    });
                }
            })(req, res, next);
        }, function (req, res) {
            var url = "/";

            if (req.session && req.session.returnTo) {
                url = req.session.returnTo;
                delete req.session.returnTo;
            }

            return res.redirect(url);
        });

        app.post("/user/authorize", connectEnsureLogin.ensureLoggedIn("/user/login"), oauthServer.decision(null, function (req, done) {
            var ares = {};
            ares.scope = req.oauth2.req.scope;
            done(null, ares);
        }));

        app.post("/client/getToken",
            passport.authenticate([
                "basic",
                "oauth2-client-password"
            ], {
                session: false
            }),
            oauthServer.token(),
            oauthServer.errorHandler()
        );

        app.listen(process.env.PORT || 3100);
        console.log("Listening on port " + (process.env.PORT || 3100));
    };
});