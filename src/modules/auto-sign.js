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
    // 用于在修复/升级后强制重新校验一次，清理旧版误写入的签到标记
    const SIGN_VER = "autoSignDataVersion";
    const SIGN_VER_NOW = "2";
    const SIGN_MESSAGE = "记上一笔，hold住我的快乐！";

    // “您今日已经签过到~~” 是服务端对已签到的唯一提示，用最精确的匹配避免误判
    const ALREADY_RE = /签过到/;
    const SUCCESS_RE = /succeedhandle_signin|签到成功/;

    const isSignedToday = () => Stg.get(SIGN_DAY) === todayStr();
    const markSigned = () => Stg.set(SIGN_DAY, todayStr());

    // 跳转到签到页（半自动）
    const gotoSignPage = () => {
        dlg("今日未签到，正在跳转到签到页...");
        setTimeout(() => {
            location.href = "plugin.php?id=dc_signin:sign";
        }, 1000);
    };

    // 回查服务端真实签到状态：签到成功后签到页会显示“您今日已经签过到~~”
    const verifySigned = async () => {
        try {
            const res = await fetch(
                "plugin.php?id=dc_signin:sign&_=" + Date.now(),
                { credentials: "include" },
            );
            const html = await res.text();
            return ALREADY_RE.test(html);
        } catch (e) {
            dlg("校验签到状态失败：" + e);
            return false;
        }
    };

    // 后台静默签到：直接请求接口，全程不跳转页面
    const silentSign = async () => {
        try {
            const res = await fetch("plugin.php?id=dc_signin:sign", {
                credentials: "include",
            });
            const html = await res.text();

            // 服务端已签到
            if (ALREADY_RE.test(html)) {
                markSigned();
                dlg("静默签到：今日已签到");
                return true;
            }

            const doc = new DOMParser().parseFromString(html, "text/html");
            const form = doc.querySelector("#signform");
            if (!form) {
                dlg("静默签到：未找到签到表单");
                return false;
            }

            const formhash =
                form.querySelector('[name="formhash"]')?.value ?? "";
            const body = new URLSearchParams();
            body.set("formhash", formhash);
            body.set("signsubmit", "yes");
            body.set("handlekey", "signin");
            body.set("emotid", "1");
            body.set("content", SIGN_MESSAGE);
            body.set("referer", location.href);

            const post = await fetch(
                "plugin.php?id=dc_signin:sign&inajax=1",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: body.toString(),
                },
            );
            const text = await post.text();

            if (ALREADY_RE.test(text) || SUCCESS_RE.test(text)) {
                markSigned();
                dlg("静默签到成功");
                return true;
            }

            // 响应格式无法判定时，回查一次服务端状态
            if (await verifySigned()) {
                markSigned();
                dlg("静默签到成功（回查确认）");
                return true;
            }

            dlg("静默签到失败：" + text.replace(/\s+/g, " ").slice(0, 120));
            return false;
        } catch (e) {
            dlg("静默签到请求异常：" + e);
            return false;
        }
    };

    // 半自动：在签到页填写并提交表单
    const semiSignOnSignPage = () => {
        const msgbox = document.querySelector("#messagetext");
        if (msgbox && ALREADY_RE.test(msgbox.innerHTML)) {
            markSigned();
            dlg("今日已签到");
            setTimeout(() => history.back(), 500);
            return;
        }

        const form = document.querySelector("#signform");
        if (!form) {
            dlg("未找到签到表单，请手动签到");
            return;
        }

        const emotid = form.querySelector('[name="emotid"]');
        const content = form.querySelector('[name="content"]');
        if (emotid) emotid.value = "1";
        if (content) content.value = SIGN_MESSAGE;

        dlg("已填充签到信息，准备提交");
        setTimeout(() => {
            form.querySelector(
                'button[type="submit"], input[type="submit"]',
            )?.click();
            dlg("已点击签到。");

            // 提交是 AJAX，必须在服务端确认成功后才能写入日期，避免误标记
            setTimeout(async () => {
                if (await verifySigned()) {
                    markSigned();
                    dlg("签到成功");
                } else {
                    dlg("签到结果未确认，请手动检查");
                }
            }, 1500);
        }, 800);
    };

    let autoSign = {
        runcase: () =>
            MExt.ValueStorage.get("autoSign") ||
            MExt.ValueStorage.get("autoSignSilent"),

        config: [
            {
                id: "autoSign",
                default: true,
                type: "check",
                name: "自动签到（半自动）",
                desc: "今日未签到时自动跳转到签到页并填写签到",
            },
            {
                id: "autoSignSilent",
                default: true,
                type: "check",
                name: "后台静默签到",
                desc: "在后台自动完成签到，不跳转签到页（优先于半自动签到）",
            },
        ],

        core: ($) => {
            dlg("自动签到已启用");
            if (!isLogin) {
                dlg("未登录，已禁用签到任务");
                return;
            }

            const silentEnabled = Stg.get("autoSignSilent");
            const semiEnabled = Stg.get("autoSign");

            // 旧版在未确认成功时就写入了日期，升级后强制重新校验一次
            if (Stg.get(SIGN_VER) !== SIGN_VER_NOW) {
                Stg.delete(SIGN_DAY);
                Stg.set(SIGN_VER, SIGN_VER_NOW);
            }

            // 处于签到页：必须先等 DOM 就绪，否则 #signform/#messagetext 尚未解析
            if (location.href.includes("dc_signin:sign")) {
                $(() => {
                    if (isSignedToday()) {
                        dlg("今日已签到。");
                        return;
                    }
                    if (silentEnabled) {
                        silentSign().then((ok) => {
                            if (ok) {
                                setTimeout(() => history.back(), 800);
                            } else {
                                semiSignOnSignPage();
                            }
                        });
                    } else {
                        semiSignOnSignPage();
                    }
                });
                return;
            }

            if (isSignedToday()) {
                dlg("今日已签到。");
                return;
            }

            if (silentEnabled) {
                // 静默失败时退回半自动跳转，二者都开则保证兜底
                silentSign().then((ok) => {
                    if (!ok && semiEnabled) {
                        gotoSignPage();
                    }
                });
            } else if (semiEnabled) {
                gotoSignPage();
            }
        },
    };
    MExt.exportModule(autoSign);
})();
