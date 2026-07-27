// Module: quickAt
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let observe = MExt.Units.observe;
    let quickAt = {
        runcase: () => {
            return MExt.ValueStorage.get("quickAtList").length > 0;
        },
        config: [
            {
                id: "quickAtList",
                default: "",
                name: "快速 @ 列表",
                type: "text",
                desc: '按下Ctrl+Shift+A/或者按钮以快速在当前输入框内插入预定义的@用户名代码.用户名之间用","(半角逗号)分隔.',
            },
        ],
        style:
            /*css */ `#fastpostatList.in_editorbtn, #postatList {
            background-size: 54px;
            background-position: -23px 3px;
        }

        #fastpostatList, #postatList {
            background-image: url(` +
            MExt.staticRes.atBtnImage +
            `);
            background-size: 50px;
            background-position: -6px 2px;
        }`,
        core: ($) => {
            let getAtCode = () => {
                // 分隔list
                let quickAtList = Stg.get("quickAtList").split(",");
                let atstr = "";
                //拼接@代码
                $(quickAtList).each((i, v) => {
                    atstr += "@" + v + " ";
                });
                return atstr;
            };
            // 将函数暴露到全局
            MExt_Func_getAtCode = getAtCode;
            // 监听按键事件
            $(document).on("keydown", (e) => {
                if (e.shiftKey && e.ctrlKey && e.keyCode == 65) {
                    // 判断是否在输入框内
                    if (
                        $(document.activeElement).prop("nodeName") == "INPUT" &&
                        $(document.activeElement).prop("type") == "text"
                    ) {
                        // 拼接方法插入
                        $(document.activeElement).val(
                            $(document.activeElement).val() + getAtCode(),
                        );
                        dlg("@ 已添加");
                    } else if (
                        $(document.activeElement).prop("nodeName") == "TEXTAREA"
                    ) {
                        // discuz内建函数插入
                        seditor_insertunit("fastpost", getAtCode(), "");
                        dlg("@ 已添加");
                    }
                }
            });
            // 高级编辑模式插入@代码
            $(() => {
                if ($("#e_iframe").length) {
                    // 由于高级模式的输入框是iFrame,无法直接监听,故再次监听高级输入框的按键事件
                    $($("#e_iframe")[0].contentWindow).on("keydown", (e) => {
                        if (e.shiftKey && e.ctrlKey && e.keyCode == 65) {
                            // 判断是否在输入框内
                            if (
                                $(document.activeElement).prop("nodeName") ==
                                "IFRAME"
                            ) {
                                //discuz内建函数插入
                                insertText(getAtCode());
                                dlg("@ 已添加");
                            }
                        }
                    });
                }
            });
            let hookReplyBtn = () => {
                if ($("#postatList").length > 0) {
                    return false;
                }
                $("#postat.fat").after(
                    '<a id="postatList" href="javascript:;" title="快速@" onclick="seditor_insertunit(\'post\',MExt_Func_getAtCode(), \'\');">快速@</a> ',
                );
                dlg("Reply at bottons appends.");
            };
            observe("#append_parent", hookReplyBtn);
            $(() => {
                $("#fastpostat").after(
                    '<a id="fastpostatList" href="javascript:;" title="快速@" class="" onclick="seditor_insertunit(\'fastpost\',MExt_Func_getAtCode(), \'\');">快速@</a> ',
                );
                // $("#e_adv_s1").append(
                const row = MExt.Units.getEditorRows();
                if (row?.selector) {
                    $(row.selector).append(
                        '<a id="fastpostatList" href="javascript:;" title="快速@" class="in_editorbtn" onclick="insertText(MExt_Func_getAtCode());">快速@</a>',
                    );
                }
            });
        },
    };
    MExt.exportModule(quickAt);
})();
