define([
    "dojo/_base/declare",
    "dojo/_base/lang"
], function (declare, lang) {
    return declare("app.util.AppHelper", null, {
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);
        },
        initApp: function () {
            Date.prototype.yyyyMMddHHmmss = function () {
                var date = this;
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                var day = date.getDate();
                var hh = date.getHours();
                var mm = date.getMinutes();
                var ss = date.getSeconds();

                return "" + year +
                (month < 10 ? "0" + month : month) +
                (day < 10 ? "0" + day : day) +
                (hh < 10 ? "0" + hh : hh) +
                (mm < 10 ? "0" + mm : mm) +
                (ss < 10 ? "0" + ss : ss);
            };

            Date.prototype.dateFormat = function () {
                var date = this;
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                var day = date.getDate();
                var hh = date.getHours();
                var mm = date.getMinutes();
                var ss = date.getSeconds();

                return "" + year + "-" +
                (month < 10 ? "0" + month : month) + "-" +
                (day < 10 ? "0" + day : day) + " " +
                (hh < 10 ? "0" + hh : hh) + ":" +
                (mm < 10 ? "0" + mm : mm) + ":" +
                (ss < 10 ? "0" + ss : ss);
            };

            String.prototype.dateFormat = function () {
                var that = this.toString();

                var date = new Date(that.substring(0, 4), that.substring(4, 6) - 1, that.substring(6, 8), that.substring(8, 10), that.substring(10, 12), that.substring(12));
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                var day = date.getDate();
                var hh = date.getHours();
                var mm = date.getMinutes();
                var ss = date.getSeconds();

                return "" + year + "-" +
                (month < 10 ? "0" + month : month) + "-" +
                (day < 10 ? "0" + day : day) + " " +
                (hh < 10 ? "0" + hh : hh) + ":" +
                (mm < 10 ? "0" + mm : mm) + ":" +
                (ss < 10 ? "0" + ss : ss);
            };

            Number.prototype.dateFormat = function () {
                var date = new Date(this);
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                var day = date.getDate();
                var hh = date.getHours();
                var mm = date.getMinutes();
                var ss = date.getSeconds();

                return "" + year + "-" +
                (month < 10 ? "0" + month : month) + "-" +
                (day < 10 ? "0" + day : day) + " " +
                (hh < 10 ? "0" + hh : hh) + ":" +
                (mm < 10 ? "0" + mm : mm) + ":" +
                (ss < 10 ? "0" + ss : ss);
            };
        }
    });
});
