// Module: 通用模块模板
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let module = {
        runcase: () => {
            return MExt.ValueStorage.get("module");
        },
        config: [
            {
                id: "Module",
                default: false,
                type: "check",
                name: "Module",
                desc: "",
            },
        ],
        style: /* css */ `
// css
`,
        core: ($) => {
            // start
            dlg("Module enabled。");

            $(() => {
                // run case
            });
        },
    };
    MExt.exportModule(module);
})();
