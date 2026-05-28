// Module: myReportReason
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let myReportReason = {
        runcase: () => {
            return MExt.ValueStorage.get("myReportReason").length > 0;
        },
        config: [
            {
                id: "myReportReason",
                default: "",
                name: "自定义举报理由",
                type: "textarea",
                desc: "在举报时提供自定义的举报理由,一行一个理由.",
            },
        ],
        core: () => {
            let reportReason = Stg.get("myReportReason").split("\n");
            const customReasons = [
                "广告垃圾",
                "违规内容",
                "恶意灌水",
                "重复发帖",
                ...reportReason,
                "其他",
            ];

            Object.defineProperty(unsafeWindow, "reasons", {
                configurable: true,
                get() {
                    return customReasons;
                },
                set(v) {
                    dlg(`已屏蔽重赋值${v}`);
                },
            });
        },
    };
    MExt.exportModule(myReportReason);
})();
