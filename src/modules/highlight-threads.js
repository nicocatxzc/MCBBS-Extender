// Module: highlightThreads
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let highlightThreads = {
        runcase: () => {
            return MExt.ValueStorage.get("highlightThreads");
        },
        config: [
            {
                id: "highlightThreads",
                default: true,
                name: "帖子列表高亮",
                type: "check",
                desc: "列表高亮显示帖子类型.",
            },
        ],
        style: /* css */ `.tl .icn {
    background-color: rgba(200, 200, 200, 0.3)!important;
    background-image: linear-gradient(-90deg, rgb(251 242 219), transparent);
    border-left: 3px solid rgb(200, 200, 200);
    transition-duration: .2s;
}
.tl .icn.newReply {
    background-color: rgba(255, 136, 0, 0.3)!important;
    border-left: 3px solid rgb(255, 136, 0);
}

.tl .icn.newMember {
    background-color: rgba(110, 232, 115, 0.3)!important;
    border-left: 3px solid rgb(110, 232, 115);
}

.tl .icn.hotThread {
    background-color: rgba(235, 132, 132, 0.3)!important;
    border-left: 3px solid rgb(235, 132, 132);
}

.tl .icn.digest {
    background-color: rgba(0, 203, 214, 0.3)!important;
    border-left: 3px solid rgb(0, 203, 214);
}

.tl .icn.digest2 {
    background-color: rgba( 0, 161, 204, 0.3)!important;
    border-left: 3px solid rgb( 0, 161, 204);
}

.tl .icn.digest3 {
    background-color: rgba(0, 123, 194, 0.3)!important;
    border-left: 3px solid rgb(0, 123, 194);
}

.tl .icn.close {
    background-color: rgba(187, 187, 187, 0.3)!important;
    border-left: 3px solid rgb(187, 187, 187);
}

.tl .icn.forumSticker {
    background-color: rgba(161, 215, 252, 0.3)!important;
    border-left: 3px solid rgb(161, 215, 252);
}

.tl .icn.partSticker {
    background-color: rgba(110, 171, 235, 0.3)!important;
    border-left: 3px solid rgb(110, 171, 235);
}

.tl .icn.globalSticker {
    background-color: rgba(33, 106, 207, 0.3)!important;
    border-left: 3px solid rgb(33, 106, 207);
}

.tl .icn.poll {
    background-color: rgba(250, 123, 147, 0.3)!important;
    border-left: 3px solid rgb(250, 123, 147);
}

.tl .icn.debate {
    background-color: rgba(0, 153, 204, 0.3)!important;
    border-left: 3px solid rgb(0, 153, 204);
}`,
        core: () => {
            let highlighting = () => {
                $('#moderate a[title*="有新回复"]')
                    .parent()
                    .addClass("newReply");
                $('#moderate img[alt="新人帖"]')
                    .parent()
                    .parent()
                    .children(".icn")
                    .addClass("newMember");
                $('#moderate img[alt="热帖"]')
                    .parent()
                    .parent()
                    .children(".icn")
                    .addClass("hotThread");
                //精华
                $('#moderate img[alt="digest"]')
                    .parent()
                    .parent()
                    .children(".icn")
                    .addClass("digest");
                $('#moderate img[title="精华 2"]')
                    .parent()
                    .parent()
                    .children(".icn")
                    .addClass("digest2");
                $('#moderate img[title="精华 3"]')
                    .parent()
                    .parent()
                    .children(".icn")
                    .addClass("digest3");
                $('#moderate a[title*="关闭的主题"]')
                    .parent()
                    .addClass("close");
                $('#moderate a[title*="本版置顶主题"]')
                    .parent()
                    .addClass("forumSticker");
                $('#moderate a[title*="分类置顶主题"]')
                    .parent()
                    .addClass("partSticker");
                $('#moderate a[title*="全局置顶主题"]')
                    .parent()
                    .addClass("globalSticker");
                $('#moderate a[title*="辩论"]').parent().addClass("debate");
                $('#moderate a[title*="投票"]').parent().addClass("poll");
                $('#moderate a[title*="悬赏"]').parent().addClass("newReply");
                $("#moderate a.s.xst[style*=color]").each((i, v) => {
                    const style =
                        v.parentNode.parentNode.querySelector(".icn").style;
                    style.setProperty(
                        "background-color",
                        v.style.color
                            .replace(")", ",0.4)")
                            .replace("rgb(", "rgba("),
                        "important",
                    );
                    style.borderLeftColor = v.style.color;
                });
                dlg("已启用帖子类型高亮。");
            };
            $(highlighting);
            let waiter = 0;
            $(() => {
                let nxBtn = $("#autopbn");
                nxBtn.on("click", () => {
                    if (waiter == 0) {
                        waiter = setInterval(() => {
                            if (nxBtn.text() != "正在加载, 请稍后...") {
                                clearInterval(waiter);
                                waiter = 0;
                                highlighting();
                            }
                        }, 100);
                    }
                });
            });
        },
    };
    MExt.exportModule(highlightThreads);
})();
