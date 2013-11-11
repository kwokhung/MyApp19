define([
    "dojo/_base/declare",
    "dojo/_base/lang"
], function (declare, lang) {
    return declare("app.util.ClientStore", null, {
        clients: null,
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);

            this.clients = [
                { id: "1", name: "Samplr", clientId: "abc123", clientSecret: "ssh-secret" }
            ];
        },
        find: function (id, done) {
            for (var i = 0, len = this.clients .length; i < len; i++) {
                var client = this.clients [i];

                if (client.id === id) {
                    return done(null, client);
                }
            }

            return done(null, null);
        },
        findByClientId: function (clientId, done) {
            for (var i = 0, len = this.clients .length; i < len; i++) {
                var client = this.clients [i];

                if (client.clientId === clientId) {
                    return done(null, client);
                }
            }

            return done(null, null);
        }
    });
});
