// Module: fixBookmarkPosition
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let fixBookmarkPosition = {
        runcase: () => {
            return MExt.ValueStorage.get("fixBookmarkPosition");
        },
        config: [
            {
                id: "fixBookmarkPosition",
                default: false,
                type: "check",
                name: "修复回到顶部书签定位",
                desc: `用于修复论坛的<a href="https://www.mcbbs.co/thread-5143-1-1.html">已知问题</a>，该问题随时可能被修复，如果书签位置异常，尝试禁用该功能即可。`,
            },
        ],
        style: /* css */ `
.mc_map_wp {
    overflow:visible;
}
.mc_map_border_foot {
    position: relative;
}
#scrolltop {
    position:sticky;
    transform:translate(50%);
    top: 80dvh;
}
`,
        core: () => {
            // start
            dlg("已启用修复书签定位。");

            $(() => {
                const scroll = document.querySelector("#scrolltop");

                const head = document.querySelector(".mc_map_border_top");
                const body = document.querySelector(".mc_map_border_left");
                const footer = document.querySelector(".mc_map_border_foot");

                body.appendChild(scroll);

                const container = document.querySelector(".mc_map_wp");

                const resizeObserver = new ResizeObserver(() => {
                    const height =
                        head.getBoundingClientRect().height +
                        body.getBoundingClientRect().height +
                        footer.getBoundingClientRect().height;

                    container.style.height = `${height}px`;
                });

                resizeObserver.observe(body);

                container.style.minHeight = `100dvh`;
            });
        },
    };
    MExt.exportModule(fixBookmarkPosition);
})();
