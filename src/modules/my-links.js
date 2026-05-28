// Module: myLinks
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let myLinks = {
        runcase: () => {
            return MExt.ValueStorage.get("myLinks").length > 0;
        },
        config: [
            {
                id: "myLinks",
                default: "",
                name: "自定义工具菜单链接",
                type: "textarea",
                desc: '在右上角"工具"菜单里添加自定义的链接,以"[名称] [链接]"的格式添加(如"个人主页 home.php"),一行一个,站外链接需要带"https://"开头.',
            },
        ],
        core: () => {
            // 分割
            $(Stg.get("myLinks").split("\n")).each((i, v) => {
                try {
                    //判断是否合法
                    if (!v.split(" ")[1] || !v.split(" ")[0]) {
                        return true;
                    }
                    // 添加
                    $(() => {
                        $("#mn_N20dc_menu").append(
                            '<li><a href="' +
                                v.split(" ")[1] +
                                '" target="_blank">' +
                                v.split(" ")[0] +
                                "</a></li>",
                        );
                    });
                } catch (ignore) {}
            });
        },
    };
    MExt.exportModule(myLinks);
})();
