// Module: rememberPage
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let rememberPage = {
        runcase: () => {
            return MExt.ValueStorage.get("rememberPage");
        },
        config: [
            {
                id: "rememberPage",
                default: true,
                type: "check",
                name: "板块内翻页记忆",
                desc: "点击板块内下一页按钮时记忆当前页.",
            },
        ],
        core: () => {
            $(() => {
                let npbtn = $("#autopbn");
                if (npbtn.length) {
                    // 绑定事件
                    let orgfunc = npbtn[0].onclick;
                    npbtn[0].onclick = null;
                    npbtn.on("click", () => {
                        if (npbtn.html() == "正在加载, 请稍后...") {
                            return false;
                        }
                        let nextpageurl = npbtn.attr("rel");
                        let curpage = parseInt(npbtn.attr("curpage"));
                        npbtn.attr("curpage", curpage + 1);
                        nextpageurl = nextpageurl.replace(
                            /&page=\d+/,
                            "&page=" + (curpage + 1),
                        );
                        $("#threadlisttableid").append(
                            '<a class="mext_rempage" rel="' +
                                nextpageurl +
                                '"></a>',
                        );
                        history.replaceState(null, null, nextpageurl);
                        orgfunc();
                    });
                    $("#separatorline").after(
                        '<a class="mext_rempage" rel="' +
                            window.location +
                            '"></a>',
                    );
                    let timer = -1;
                    // 事件防抖
                    $(window).on("scroll", () => {
                        clearTimeout(timer);
                        timer = setTimeout(() => {
                            let scroll =
                                document.scrollingElement.scrollTop -
                                window.innerHeight / 2;
                            let url = null;
                            document
                                .querySelectorAll(".mext_rempage")
                                .forEach((v, i) => {
                                    let vtop = v.offsetTop;
                                    if (vtop < scroll || i == 0) {
                                        url = v.rel;
                                    }
                                });
                            if (url) {
                                history.replaceState(null, null, url);
                            }
                        }, 250);
                    });
                }
                dlg("已激活板块内翻页记忆。");
            });
        },
    };
    MExt.exportModule(rememberPage);
})();
