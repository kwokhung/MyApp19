define([
    "dojo/_base/declare",
    "dojo/_base/lang"
], function (declare, lang) {
    return declare("app.util.GeneralHelper", null, {
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);
        },
        uid: function (len) {
            var buf = [];
            var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var charlen = chars.length;

            for (var i = 0; i < len; ++i) {
                buf.push(chars[this.getRandomInt(0, charlen - 1)]);
            }

            return buf.join("");
        },
        getRandomInt: function (min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    });
});
