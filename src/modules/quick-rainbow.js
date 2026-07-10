// Module: quickRainbow
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let observe = MExt.Units.observe;
    let quickRainbow = {
        runcase: () => {
            return MExt.ValueStorage.get("quickRainbow");
        },
        config: [
            {
                id: "quickRainbow",
                default: true,
                type: "check",
                name: "编辑器支持彩虹文字",
                desc: "快速向贴内插入彩虹文字.",
            },
        ],
        style:
            /*css */ `#fastpostrainbow, #postrainbow,#e_rbn_s1 {
background-image: url(${MExt.staticRes.rainbowBtnImage});
background-size: 28px;
background-position: center top;
}
#fastpostrainbow.in_editorbtn , #postrainbow {
background-size: 16px;
background-position: center;
}`,
        core: () => {
            let rainbowFast = () => {
                let target = document.getElementById("fastpostmessage");
                if (target.selectionStart != target.selectionEnd) {
                    let str = target.value.substr(
                        target.selectionStart,
                        target.selectionEnd,
                    );
                    seditor_insertunit("fastpost", gencode(str, 0), "");
                }
            };
            let rainbowFloat = () => {
                let target = document.getElementById("postmessage");
                if (target.selectionStart != target.selectionEnd) {
                    let str = target.value.substr(
                        target.selectionStart,
                        target.selectionEnd,
                    );
                    seditor_insertunit("post", gencode(str, 0), "");
                }
            };
            let rainbow = () => {
                if (getSel() == "") {
                    return;
                }
                addSnapshot(getEditorContents());
                insertText(gencode(getSel(), wysiwyg));
            };
            let hookReplyBtn = () => {
                if ($("#postrainbow").length > 0) {
                    return false;
                }
                let btn = document.createElement("a");
                btn.id = "postrainbow";
                btn.href = "javascript:;";
                btn.title = "彩虹文字";
                btn.addEventListener("click", rainbowFloat);
                btn.innerText = "彩虹文字";
                $("#postat.fat").after(btn);
                dlg("Reply bottons appends.");
            };
            // $("#append_parent").on("DOMNodeInserted", hookReplyBtn);
            observe("#append_parent", hookReplyBtn);
            $(() => {
                let btn = document.createElement("a");
                btn.id = "fastpostrainbow";
                btn.href = "javascript:;";
                btn.title = "彩虹文字";
                btn.className = "in_editorbtn";
                btn.addEventListener("click", rainbowFast);
                btn.innerText = "彩虹文字";
                $("#fastpostat").after(btn);
                let btn2 = document.createElement("a");
                btn2.id = "e_rbn_s1";
                btn2.href = "javascript:;";
                btn2.title = "彩虹文字";
                btn2.addEventListener("click", rainbow);
                btn2.innerText = "彩虹文字";
                // $("#e_adv_s1").append(btn2);
                const row = MExt.Units.getEditorRows();
                if (row?.element) {
                    row.element.append(btn2);
                }
            });
            let nextColor = (clr, step) => {
                if (clr.r == 255 && clr.b != 255) {
                    clr.g -= step;
                } else if (clr.g == 255 && clr.r != 255) {
                    clr.b -= step;
                } else if (clr.b == 255 && clr.g != 255) {
                    clr.r -= step;
                }
                while (
                    clr.r > 255 ||
                    clr.r < 0 ||
                    clr.g > 255 ||
                    clr.g < 0 ||
                    clr.b > 255 ||
                    clr.b < 0
                ) {
                    if (clr.r > 255) {
                        clr.g += 255 - clr.r;
                        clr.r = 255;
                        continue;
                    }
                    if (clr.g < 0) {
                        clr.b -= clr.g;
                        clr.g = 0;
                        continue;
                    }
                    if (clr.b > 255) {
                        clr.r += 255 - clr.b;
                        clr.b = 255;
                        continue;
                    }
                    if (clr.r < 0) {
                        clr.g -= clr.r;
                        clr.r = 0;
                        continue;
                    }
                    if (clr.g > 255) {
                        clr.b += 255 - clr.g;
                        clr.g = 255;
                        continue;
                    }
                    if (clr.b < 0) {
                        clr.r -= clr.b;
                        clr.b = 0;
                        continue;
                    }
                }
                return clr;
            };
            let dCode = (str) => {
                while (str.length < 2) {
                    str = "0" + str;
                }
                return str;
            };
            let HexC = (color) => {
                return (
                    "#" +
                    dCode(parseInt(color.r).toString(16)) +
                    dCode(parseInt(color.g).toString(16)) +
                    dCode(parseInt(color.b).toString(16))
                );
            };
            let gencode = (str, type) => {
                let color = {
                    r: 255,
                    g: 0,
                    b: 0,
                };
                let len = str.length;
                let step = 1530 / len < 1 ? 1 : 1530 / len;
                let rstr = "";
                for (let i = 0; i < len; i++) {
                    if (type == 0) {
                        rstr +=
                            "[color=" +
                            HexC(color) +
                            "]" +
                            str.charAt(i) +
                            "[/color]";
                    } else {
                        rstr +=
                            '<font color="' +
                            HexC(color) +
                            '">' +
                            str.charAt(i) +
                            "</font>";
                    }
                    color = nextColor(color, step);
                }
                return rstr;
            };
        },
    };
    MExt.exportModule(quickRainbow);
})();
