define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/store/Memory",
    "dojo/store/Observable"
], function (declare, lang, Memory, Observable) {
    return declare("app.util.StoredData", null, {
        data: null,
        store: null,
        storeLabel: null,
        storeIdentifier: "id",
        constructor: function (kwArgs) {
            lang.mixin(this, kwArgs);

            var itemData = [];
            var itemStore = new Observable(new Memory({
                data: {
                    "label": this.storeLabel,
                    "identifier": this.storeIdentifier,
                    "items": itemData
                }
            }));

            this.data = itemData;
            this.store = itemStore;
        }
    });
});
