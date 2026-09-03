// Module: autoTask
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    const isLogin = MExt.Units.isLogin;

    const todayStr = () => {
        const d = new Date().toDateString();
        return d;
    };

    const TASK_DAY = "autoTaskLastDate";

    let autoTask = {
        runcase: () => MExt.ValueStorage.get("autoTask"),

        config: [
            {
                id: "autoTask",
                default: true,
                type: "check",
                name: "自动任务",
                desc: "自动领取与完成常规任务",
            },
        ],

        core: ($) => {
            dlg("自动任务已启用");
            if (!isLogin) {
                dlg("未登录，已禁用签到任务");
                return;
            }
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

                if (!res) {
                    return null;
                }

                const html = await res.text();
                return new DOMParser().parseFromString(html, "text/html");
            };

            const applyTasks = async () => {
                const page = await parsePageDOM("/home.php?mod=task&item=new");
                if (!page) return;

                const jobs = [];

                taskArr.forEach((id) => {
                    const task = page.querySelector(
                        `a[href^="home.php?mod=task&do=apply&id=${id}"]`,
                    );
                    if (task) {
                        jobs.push(
                            safeFetch(`/home.php?mod=task&do=apply&id=${id}`),
                        );
                    }
                });

                const results = await Promise.allSettled(jobs);

                const success = results.filter(
                    (x) => x.status === "fulfilled",
                ).length;

                dlg(`已领取 ${success} 个任务`);

                const dailyTask = await parsePageDOM(
                    "/home.php?mod=task&do=view&id=1",
                );
                if (dailyTask) {
                    const dailyPost = Array.from(
                        dailyTask?.querySelectorAll("a") ?? [],
                    ).find((a) => a?.innerText.trim() === "领取奖励");
                    if (dailyPost.onclick) {
                        dlg("每日任务尚未领取，将继续检查任务情况");
                        return;
                    } else {
                        Stg.set(TASK_DAY, todayStr());
                    }
                } else {
                    dlg("每日任务检查失败，将继续检查任务情况");
                }
            };

            const checkTasks = async () => {
                try {
                    console.log("开始检查任务");
                    const page = await parsePageDOM(
                        "/home.php?mod=task&item=doing",
                    );
                    if (!page) return;

                    const jobs = [];

                    taskArr.forEach((id) => {
                        const task = page.querySelector(`#csc_${id}`);

                        if (!task) return;

                        if (
                            task.innerHTML === "100" ||
                            ["1", "3", "18"].includes(id)
                        ) {
                            jobs.push(
                                safeFetch(
                                    `/home.php?mod=task&do=draw&id=${id}`,
                                ),
                            );
                        }
                    });

                    await Promise.allSettled(jobs);
                } catch (error) {
                    console.err(error);
                }
            };

            // 页面启动尝试领取
            if (Stg.get(TASK_DAY) !== todayStr()) {
                applyTasks();
            }

            // 回帖后检查任务
            if (unsafeWindow?.fastpostvalidate) {
                const fastReplyfn = fastpostvalidate;
                unsafeWindow.fastpostvalidate = function (...args) {
                    let result = fastReplyfn(...args);
                    setTimeout(() => {
                        checkTasks();
                    }, 100);
                    if (result) {
                        return true;
                    } else {
                        return false;
                    }
                };
            } else {
                console.log("当前不在回帖页");
            }

            // ?疑似失效
            $(this).on(
                "DiscuzAjaxGetFinished DiscuzAjaxPostFinished",
                checkTasks,
            );
        },
    };
    MExt.exportModule(autoTask);
})();
