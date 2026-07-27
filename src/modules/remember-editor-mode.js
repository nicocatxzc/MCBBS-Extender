// Module: rememberEditorMode
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let rememberEditorMode = {
        runcase: () => {
            return MExt.ValueStorage.get("remenberEditMode");
        },
        config: [
            {
                id: "remenberEditMode",
                default: true,
                name: "记忆编辑器模式",
                type: "check",
                desc: "记忆高级编辑器是纯文本模式还是即时模式.",
            },
        ],
        core: ($) => {
            if (localStorage.getItem("MExt_EditMode") === null) {
                localStorage.setItem("MExt_EditMode", "false");
            }
            $(() => {
                dlg("已启用编辑模式记忆。");
                $("#e_switchercheck").on("click", (e) => {
                    dlg("编辑器模式已切换。");
                    localStorage.setItem(
                        "MExt_EditMode",
                        e.currentTarget.checked.toString(),
                    );
                });
                if (localStorage.getItem("MExt_EditMode") == "true") {
                    dlg("编辑器模式已切换。");
                    $("#e_switchercheck").click();
                }
            });
        },
    };
    MExt.exportModule(rememberEditorMode);
})();
