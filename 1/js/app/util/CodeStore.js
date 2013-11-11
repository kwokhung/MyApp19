define([
    "dojo/_base/declare",
    "dojo/_base/lang"
], function (declare, lang) {
    return declare("app.util.CodeStore", null, {
        codes: null,
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);

            this.codes = {};
        },
        find: function (key, done) {
            var code = this.codes[key];

            return done(null, code);
        },
        save: function (code, clientID, redirectURI, userID, scope, done) {
            this.codes[code] = {
                clientID: clientID,
                redirectURI: redirectURI,
                userID: userID,
                scope: scope
            };

            return done(null);
        },
        "delete": function (key, done) {
            delete this.codes[key];

            return done(null);
        }
    });
});
