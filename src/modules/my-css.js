// Module: myCSS
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let myCSS = {
        runcase: () => {
            return MExt.ValueStorage.get("myCSS").length > 0;
        },
        config: [
            {
                id: "myCSS",
                default: "",
                name: "自定义CSS",
                type: "textarea",
                desc: "在框内的CSS会被加载到页面内,可自由发挥.",
            },
        ],
        style: MExt.ValueStorage.get("myCSS"),
    };
    MExt.exportModule(myCSS);
})();
