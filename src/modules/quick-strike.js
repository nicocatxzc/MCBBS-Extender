// Module: quickStrike
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let observe = MExt.Units.observe;
    let quickStrike = {
        runcase: () => {
            return MExt.ValueStorage.get("quickStrike");
        },
        config: [
            {
                id: "quickStrike",
                default: true,
                type: "check",
                name: "快速删除线",
                desc: "在编辑器中加入删除线按钮",
            },
        ],

        style: /*css */ `
        #e_strike_s1,#poststrike,#fastpoststrike {
            background-position: -20px -60px;
        }
        `,
        core: () => {
            const wrapStrike = (str, type = 0) => {
                if (!str) return "";
                if (type === 0) {
                    return "[s]" + str + "[/s]";
                } else {
                    return "<strike>" + str + "</strike>";
                }
            };

            // 快速回复
            const strikeFast = () => {
                const target = document.getElementById("fastpostmessage");
                if (!target) return;

                if (target.selectionStart !== target.selectionEnd) {
                    const str = target.value.substring(
                        target.selectionStart,
                        target.selectionEnd,
                    );
                    seditor_insertunit("fastpost", wrapStrike(str, 0), "");
                }
            };

            // 浮动回复
            const strikeFloat = () => {
                const target = document.getElementById("postmessage");
                if (!target) return;

                if (target.selectionStart !== target.selectionEnd) {
                    const str = target.value.substring(
                        target.selectionStart,
                        target.selectionEnd,
                    );
                    seditor_insertunit("post", wrapStrike(str, 0), "");
                }
            };

            // 新版编辑器
            const strikeEditor = () => {
                if (getSel() === "") return;

                addSnapshot(getEditorContents());
                insertText(wrapStrike(getSel(), wysiwyg));
            };

            // 回复区
            const hookReplyBtn = () => {
                if ($("#poststrike").length > 0) return;

                const btn = document.createElement("a");
                btn.id = "poststrike";
                btn.href = "javascript:;";
                btn.title = "删除线";
                btn.innerText = "删除线";
                btn.addEventListener("click", strikeFloat);

                $("#postat.fat").after(btn);
            };

            observe("#append_parent", hookReplyBtn);

            // 页面初始化
            $(() => {
                // 快速回复
                const fastBtn = document.createElement("a");
                fastBtn.id = "fastpoststrike";
                fastBtn.href = "javascript:;";
                fastBtn.title = "删除线";
                fastBtn.className = "in_editorbtn";
                fastBtn.innerText = "删除线";
                fastBtn.addEventListener("click", strikeFast);
                $("#fastpostat").after(fastBtn);

                // 新编辑器
                const editorBtn = document.createElement("a");
                editorBtn.id = "e_strike_s1";
                editorBtn.href = "javascript:;";
                editorBtn.title = "删除线";
                editorBtn.innerText = "删除线";
                editorBtn.addEventListener("click", strikeEditor);

                const row = MExt.Units.getEditorRows();
                if (row?.element) {
                    console.log(row.element);
                    console.log(editorBtn);
                    row.element.append(editorBtn);
                }
            });
        },
    };
    MExt.exportModule(quickStrike);
})();
