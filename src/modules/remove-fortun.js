// Module: removeFortune
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let module = {
        runcase: () => {
            return MExt.ValueStorage.get("removeFortune");
        },
        config: [
            {
                id: "removeFortune",
                default: false,
                type: "check",
                name: "移除听天命",
                desc: "移除页面右上角的听天命",
            },
        ],
        style: /* css */ `
`,
        core: ($) => {
            // start
            dlg("已移除听天命。");

            $(() => {
                const fortune = document.querySelector(".fortune-choutie")
                if(fortune) {
                    fortune.remove()
                }
            });
        },
    };
    MExt.exportModule(module);
})();
