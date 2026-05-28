// Module: miscFix
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let miscFix = {
        runcase: () => {
            return /^[01]*$/.exec(Stg.get("miscFix"));
        },
        config: [
            {
                id: "miscFix",
                default: "",
                name: "杂项修复",
                type: "text",
                desc: "此值用于规定杂项修复的行为,默认值为空,修改为0000000000以关闭全部.错误的值会使该项失效.详情请查阅源码.",
            },
        ],
        style: "",
        core: () => {
            let fixconf = Stg.get("miscFix").split("");
            let fixlist = [
                //修复用户组页面不对齐的问题
                { style: ".tdats .tb{margin-top:11px}" },
                // 允许改变个人签名编辑框大小
                { style: "#sightmlmessage{resize:vertical;}" },
                // 签到页页码修复
                {
                    script: /*js*/ `
                    const params= new URLSearchParams(window.location.search);
                    const query = Object.fromEntries(params.entries());
                    if(query?.id=="dc_signin"&&query?.action=="my") {
                        const pages = document.querySelectorAll(".pg a")
                        pages.forEach((page)=>{
                            console.log(page)
                            page.href=page.href.replace("action=qdlist","action=my")
                        })
                    }
                    `,
                },
            ];
            let styleContent = "";

            $(fixlist).each((i, v) => {
                if (typeof fixconf[i] == "undefined") {
                    fixconf[i] = "1";
                }
                if (fixconf[i] === "1") {
                    // 拼接样式字符串
                    styleContent += fixlist[i].style ? fixlist[i].style : "";
                    // 执行脚本
                    eval(fixlist[i].script ? fixlist[i].script : "");
                }
            });
            MExt.Units.appendStyle(styleContent);
        },
    };
    MExt.exportModule(miscFix);
})();
