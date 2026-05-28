// Module: queryMessage
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    const isLogin = MExt.Units.isLogin;
    let queryMessage = {
        runcase: () => {
            return MExt.ValueStorage.get("queryMessage");
        },
        config: [
            {
                id: "queryMessage",
                default: true,
                type: "check",
                name: "后台轮询消息",
                desc: "在后台自动查询是否有新的消息并推送,需保证至少打开一个页面.",
            },
            {
                id: "queryMessageInterval",
                default: 60,
                type: "num",
                name: "后台轮询消息间隔",
                desc: "两次轮询消息之间的间隔,单位秒.注意,过低的值可能会导致你被论坛屏蔽,超过200的值可能会导致消息反复推送.",
            },
        ],
        core: () => {
            if (!isLogin) {
                dlg("未登录，已禁用消息轮询");
                return;
            }
            let getRequest = MExt.Units.getRequest;
            let checkNotifica = (noNotifica = false) => {
                if (localStorage.getItem("MExt_ActiveQueryId") != queryId) {
                    return false;
                }
                dlg("正在检查消息...");
                $.get("/forum.php?mod=misc", (d) => {
                    // 设置最后通知时间为当前时间,以防止反复推送
                    localStorage.setItem("notifica-time", new Date().getTime());
                    let dom = $(d);
                    // 获得顶栏图标类
                    let noticlass = dom.find("#myprompt").attr("class");
                    // 获得通知菜单元素
                    let notimenu = dom.filter("#myprompt_menu");
                    // 将顶栏图标类写入当前页
                    $("#myprompt").attr("class", noticlass);
                    // 将通知菜单写入当前页
                    $("#myprompt_menu").html(notimenu.html());
                    // 获得消息内容,用作缓存
                    let noticontent = notimenu.html();
                    // 判断是否应该发送消息
                    if (
                        !noNotifica &&
                        localStorage.getItem("MExt_LastNoticeContent") !=
                            noticontent
                    ) {
                        // 获得通知脚本(暴力)
                        let scp = dom
                            .filter("script[src*=html5notification]")
                            .nextUntil("div")
                            .last()
                            .text();
                        // 将最后通知时间设置为1,强行启用通知
                        localStorage.setItem("notifica-time", 1);
                        // 执行通知脚本
                        eval(scp);
                        dlg("已发送通知");
                        // 写入消息缓存
                        localStorage.setItem(
                            "MExt_LastNoticeContent",
                            noticontent,
                        );
                        localStorage.setItem("MExt_LastNoticeCount", noticlass);
                    }
                });
            };
            // 刷新消息缓存
            let flushContent = () => {
                $.get("/forum.php?mod=misc", (d) => {
                    let dom = $(d);
                    let noticontent = dom.filter("#myprompt_menu").html();
                    let noticlass = dom.find("#myprompt").attr("class");
                    // 写入消息缓存
                    localStorage.setItem("MExt_LastNoticeContent", noticontent);
                    localStorage.setItem("MExt_LastNoticeCount", noticlass);
                });
            };
            // 生成queryID,用于页面间的互斥
            let queryId = hash(new Date().getTime().toLocaleString(), 16);
            // 判断是否在消息页面||最后通知时间是否超过200秒
            if (
                (location.pathname == "/home.php" &&
                    (getRequest("do") == "pm" ||
                        getRequest("do") == "notice")) ||
                new Date().getTime() - localStorage.getItem("notifica-time") >
                    200000
            ) {
                flushContent();
            } else {
                checkNotifica();
            }
            dlg("检查的id为 " + queryId + "。");
            // 运行定时器,用于检查其他页面是否在运行
            setInterval(() => {
                if (localStorage.getItem("MExt_LastQuery") == "") {
                    localStorage.setItem("MExt_LastQuery", 0);
                }
                let nowtime = Math.floor(new Date().getTime() / 1000);
                if (
                    (localStorage.getItem("MExt_ActiveQueryId") == "" ||
                        nowtime - localStorage.getItem("MExt_LastQuery") > 5) &&
                    localStorage.getItem("MExt_ActiveQueryId") != queryId
                ) {
                    localStorage.setItem("MExt_ActiveQueryId", queryId);
                    checkNotifica();
                    dlg("替代正在检查的轮询检查。");
                }
                if (localStorage.getItem("MExt_ActiveQueryId") == queryId) {
                    localStorage.setItem("MExt_LastQuery", nowtime);
                }
            }, 1000);
            dlg("Running checker actived.");
            // 判断是否有HTML5Notification
            if (!unsafeWindow.Html5notification) {
                $.getScript("data/cache/html5notification.js?xm6");
                dlg("添加H5消息。");
            }
            //
            $(window).on("focus", () => {
                dlg("从缓存获取内容。");
                $("#myprompt_menu").html(
                    localStorage.getItem("MExt_LastNoticeContent"),
                );
                $("#myprompt").attr(
                    "class",
                    localStorage.getItem("MExt_LastNoticeCount"),
                );
            });
            // 定时运行检查函数
            setInterval(
                checkNotifica,
                MExt.ValueStorage.get("queryMessageInterval") * 1000,
            );
            dlg("已激活消息轮询");
        },
    };
    MExt.exportModule(queryMessage);
})();
