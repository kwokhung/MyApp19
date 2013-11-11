define([
    "dojo/_base/declare",
    "dojo/_base/lang"
], function (declare, lang) {
    return declare("app.util.UserStore", null, {
        users: null,
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);

            this.users = [
                { id: "1", username: "bob", password: "secret", name: "Bob Smith" },
                { id: "2", username: "joe", password: "password", name: "Joe Davis" }
            ];
        },
        find: function (id, done) {
            for (var i = 0, len = this.users.length; i < len; i++) {
                var user = this.users[i];

                if (user.id === id) {
                    return done(null, user);
                }
            }

            return done(null, null);
        },
        findByUsername: function (username, done) {
            for (var i = 0, len = this.users.length; i < len; i++) {
                var user = this.users[i];

                if (user.username === username) {
                    return done(null, user);
                }
            }

            return done(null, null);
        }
    });
});
