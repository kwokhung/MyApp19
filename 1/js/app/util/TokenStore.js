define([
    "dojo/_base/declare",
    "dojo/_base/lang"
], function (declare, lang) {
    return declare("app.util.TokenStore", null, {
        tokens: null,
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);

            this.tokens = {};
        },
        find: function (key, done) {
            var token = this.tokens[key];

            return done(null, token);
        },
        save: function (token, userID, clientID, scope, done) {
            this.tokens[token] = {
                userID: userID,
                clientID: clientID,
                scope: scope
            };

            return done(null);
        }
    });
});
