// Module: restrictMedalLine
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let restrictMedalLine = {
        runcase: () => {
            return MExt.ValueStorage.get("revertPortalToHomepage");
        },
        config: [
            {
                id: "revertPortalToHomepage",
                default: false,
                type: "check",
                name: "恢复导航栏首页",
                desc: "启用后导航栏门户按钮将替换为旧版首页",
            },
        ],
        style: /* css */ ``,
        core: () => {
            // start
            dlg("已启用回退导航栏首页。");

            $(() => {
                let portal = document.querySelector(
                    `#mc_nv a[href^="portal.php"]`,
                );

                console.log(portal);
                if (portal) {
                    portal.href = "index.php";
                    portal.textContent = "首页";
                }
            });
        },
    };
    MExt.exportModule(restrictMedalLine);
})();
