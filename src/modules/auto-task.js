// Module: autoTask
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    const isLogin = MExt.Units.isLogin;
    const SIGN_DAY = "autoSignLastDate";

    const todayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

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

        core: () => {
            dlg("自动任务已启用");
            if (!isLogin) {
                dlg("未登录，已禁用签到任务");
                return;
            }
            const taskArr = ["1", "3", "18", "19", "25"];

            const parsePageDOM = async (url) => {
                const res = await fetch(url, { credentials: "include" });
                const html = await res.text();
                return new DOMParser().parseFromString(html, "text/html");
            };

            const applyTasks = async () => {
                const page = await parsePageDOM("/home.php?mod=task&item=new");
                if (!page) return;

                taskArr.forEach((id) => {
                    const task = page.querySelector(
                        `a[href^="home.php?mod=task&do=apply&id=${id}"]`,
                    );
                    if (task) {
                        fetch(`/home.php?mod=task&do=apply&id=${id}`);
                    }
                });
            };

            const checkTasks = async () => {
                console.log("开始检查任务")
                const page = await parsePageDOM(
                    "/home.php?mod=task&item=doing",
                );
                if (!page) return;

                taskArr.forEach((id) => {
                    const task = page.querySelector(`#csc_${id}`);

                    if (!task) return;

                    if (
                        task.innerHTML === "100" ||
                        ["1", "3", "18"].includes(id)
                    ) {
                        fetch(`/home.php?mod=task&do=draw&id=${id}`);
                    }
                });
            };

            // 页面启动尝试领取
            if (Stg.get(SIGN_DAY) !== todayStr()) {
                applyTasks();
            }

            // 回帖后检查任务
            const fastReplyfn = fastpostvalidate;
            unsafeWindow.fastpostvalidate = function(...args) {
                let result = fastReplyfn(...args)
                checkTasks();
                if(result) {
                    setTimeout(100,()=>{
                        checkTasks();
                    })
                    return true;
                } else {
                    return false;
                }
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
