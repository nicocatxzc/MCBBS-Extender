// Module: autoTask
(() => {
    const MExt = unsafeWindow.MExt;
    const $ = MExt.jQuery;
    const dlg = MExt.debugLog;
    const Stg = MExt.ValueStorage;
    const isLogin = MExt.Units.isLogin;

    const todayStr = () => new Date().toDateString();

    const TASK_DAY = "autoTaskLastDate";

    const autoTask = {
        runcase: () => Stg.get("autoTask"),

        config: [
            {
                id: "autoTask",
                default: true,
                type: "check",
                name: "自动任务",
                desc: "自动申请常规任务、领取已完成任务的奖励",
            },
        ],

        core: ($) => {
            dlg("自动任务已启用");
            if (!isLogin) {
                dlg("未登录，已禁用签到任务");
                return;
            }
            // 自动申请的任务 id
            const taskArr = ["1", "3", "18", "19", "25"];

            const safeFetch = async (url, options = {}) => {
                try {
                    const res = await fetch(url, {
                        credentials: "include",
                        ...options,
                    });
                    if (!res.ok) {
                        throw new Error(`${res.status} ${res.statusText}`);
                    }
                    return res;
                } catch (err) {
                    dlg(`请求失败: ${url}`);
                    console.error(err);
                    return null;
                }
            };

            const parsePageDOM = async (url) => {
                const res = await safeFetch(url);
                if (!res) return null;
                const html = await res.text();
                return new DOMParser().parseFromString(html, "text/html");
            };

            // 申请常规任务（扫描页面上的所有申请链接，兼容 &amp; 实体）
            const applyTasks = async () => {
                const page = await parsePageDOM("/home.php?mod=task&item=new");
                if (!page) return { ok: false, applied: 0 };

                const jobs = [];
                page.querySelectorAll('a[href*="do=apply"]').forEach((a) => {
                    const m = /do=apply&(?:amp;)?id=(\d+)/.exec(
                        a.getAttribute("href") || "",
                    );
                    if (!m || !taskArr.includes(m[1])) return;
                    jobs.push(safeFetch("/home.php?mod=task&do=apply&id=" + m[1]));
                });

                const results = await Promise.allSettled(jobs);
                const success = results.filter(
                    (x) => x.status === "fulfilled" && x.value,
                ).length;

                if (success) dlg(`已申请 ${success} 个任务`);
                Stg.set(TASK_DAY, todayStr());
                return { ok: true, applied: success };
            };

            // 进行中任务 id 列表（失败返回 null）
            const listDoingIds = async () => {
                const page = await parsePageDOM("/home.php?mod=task&item=doing");
                if (!page) return null;
                return Array.from(page.querySelectorAll('[id^="csc_"]')).map((el) =>
                    el.id.replace("csc_", ""),
                );
            };

            // 领取已完成（可领奖）任务的奖励
            // Discuz 任务行：进度单元格 #csc_<id>，领奖链接 do=draw&id=<id>；
            // 可领取时按钮 class 含 taskrw，未完成时为 taskda。
            const checkTasks = async () => {
                const claimed = [];
                const skipped = [];
                try {
                    const page = await parsePageDOM("/home.php?mod=task&item=doing");
                    if (!page) return { ok: false, claimed, skipped };

                    const jobs = [];
                    page.querySelectorAll('a[href*="do=draw"]').forEach((a) => {
                        const m = /do=draw&(?:amp;)?id=(\d+)/.exec(
                            a.getAttribute("href") || "",
                        );
                        if (!m) return;
                        const id = m[1];
                        const prog = page.querySelector("#csc_" + id);
                        const pct = prog ? prog.textContent.trim() : "";
                        const cls = (a.className || "") + " " +
                            (a.parentElement ? a.parentElement.className : "");
                        const claimable = pct === "100" || /taskrw/.test(cls);
                        if (!claimable) {
                            skipped.push(id);
                            return;
                        }
                        jobs.push(
                            safeFetch("/home.php?mod=task&do=draw&id=" + id).then(
                                (res) => {
                                    if (res) claimed.push(id);
                                    return res;
                                },
                            ),
                        );
                    });

                    await Promise.allSettled(jobs);
                    if (claimed.length) dlg(`已领取 ${claimed.length} 个任务奖励`);
                } catch (error) {
                    console.error("[MCBBS Extender] 检查任务失败:", error);
                    return { ok: false, claimed, skipped };
                }
                return { ok: true, claimed, skipped };
            };

            // 对外暴露，供其他模块（如自动水贴）联动触发
            MExt.autoTask = {
                applyTasks,
                checkTasks,
                listDoingIds,
                drawTask: (id) =>
                    safeFetch("/home.php?mod=task&do=draw&id=" + id),
            };

            // 页面启动尝试申请
            if (Stg.get(TASK_DAY) !== todayStr()) {
                applyTasks();
            }

            // 回帖后检查任务
            if (typeof unsafeWindow.fastpostvalidate === "function") {
                const fastReplyfn = unsafeWindow.fastpostvalidate;
                unsafeWindow.fastpostvalidate = function (...args) {
                    const result = fastReplyfn(...args);
                    setTimeout(() => {
                        checkTasks();
                    }, 1500);
                    return result ? true : false;
                };
            }

            // Discuz ajax 完成事件（core 会把事件派发到 document）
            $(document).on(
                "DiscuzAjaxGetFinished DiscuzAjaxPostFinished",
                () => {
                    checkTasks();
                },
            );
        },
    };
    MExt.exportModule(autoTask);
})();
