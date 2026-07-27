// Module: autoSign
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    const isLogin = MExt.Units.isLogin;

    const todayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const SIGN_DAY = "autoSignLastDate";

    let autoSign = {
        runcase: () => MExt.ValueStorage.get("autoSign"),

        config: [
            {
                id: "autoSign",
                default: true,
                type: "check",
                name: "自动签到",
                desc: "每日首次登录自动签到",
            },
        ],

        core: ($) => {
            dlg("自动签到已启用");
            if (!isLogin) {
                dlg("未登录，已禁用签到任务");
                return;
            }
            if (location.href.includes("dc_signin:sign")) {
                const msgbox = document.querySelector("#messagetext");

                // 已签到
                if (msgbox && msgbox.innerHTML.includes("签过到")) {
                    Stg.set(SIGN_DAY, todayStr());

                    dlg("今日已签到");

                    setTimeout(() => {
                        history.back();
                    }, 500);

                    return;
                }

                // 自动点击签到
                const form = document.querySelector("#signform");

                if (form) {
                    const emotid = form.querySelector('[name="emotid"]');
                    const content = form.querySelector('[name="content"]');

                    if (emotid) emotid.value = "1";
                    if (content) content.value = "记上一笔，hold住我的快乐！";

                    setTimeout(() => {
                        form.querySelector(
                            "button[type=submit], input[type=submit]",
                        )?.click();
                        Stg.set(SIGN_DAY, todayStr());
                        dlg("已点击签到。");
                    }, 800);
                }

                return;
            }

            if (Stg.get(SIGN_DAY) !== todayStr()) {
                dlg("今日未签到，正在跳转到签到页...");

                // 延迟避免与页面初始化冲突
                setTimeout(() => {
                    location.href = "plugin.php?id=dc_signin:sign";
                }, 1000);
            } else {
                dlg("今日已签到。");
            }
        },
    };
    MExt.exportModule(autoSign);
})();
