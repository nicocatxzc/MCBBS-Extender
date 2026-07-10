(() => {
    let ShouldRun = true;
    // jQuery检查
    if (typeof jQuery == "undefined") {
        console.error(
            "This page does NOT contain JQuery,MCBBS Extender will not work.",
        );
        ShouldRun = false;
    }
    //在手机页面主动禁用
    // if (document.getElementsByTagName("meta").viewport) {
    //     console.log(
    //         "MCBBS Extender not fully compatible with Moblie page,exit manually",
    //     );
    //     ShouldRun = false;
    // }
    //夹带私货
    const getTextStyle = (color) => {
        return `color:${color};font-size:12px;font-family:"Comic Sans MS", "Comic Neue", "Tahoma";font-weight:900`;
    };
    console.log(
        `%cPlugin \n%cMCBBS Extender \n%cBy nicocat \n%chttps://github.com/nicocatxzc/`,
        getTextStyle("#f1e05a"),
        getTextStyle("#65c9fe"),
        getTextStyle("#fabe03"),
        getTextStyle("inherit"),
    );
    console.log(
        " %c 原作 %c Zapic https://i.zapic.moe ",
        "color: #ffffff; background: #ffbf00; padding:5px;",
        "background: #E91E63; padding:5px; color:#ffffff",
    );
    // Gear浏览器上的Polyfill
    if (typeof console.debug == "undefined") {
        console.debug = function () {};
    }
    // 基本信息初始化
    let version = "v2.6.2";
    let vercode = 121210;
    let valueList = {};
    let configList = [];
    // 加载ValueStorage
    try {
        valueList = JSON.parse(localStorage.getItem("MExt_config"));
        if (typeof valueList != "object" || valueList == null) {
            valueList = {};
            localStorage.setItem("MExt_config", "{}");
        }
    } catch (ignore) {
        valueList = {};
        localStorage.setItem("MExt_config", "{}");
    }
    // 导出模块
    let exportModule = (...modules) => {
        if (!ShouldRun) {
            return;
        }
        for (let m of modules) {
            try {
                moduleLoader(m);
            } catch (e) {
                console.error(
                    "Error occurred while try to load a module:\n" + e,
                );
            }
        }
    };
    let $ = unsafeWindow.jQuery;
    let dlg = (m) => {
        console.debug("[MCBBS Extender]" + m);
    };
    let setValue = (name, val) => {
        valueList[name] = val;
        localStorage.setItem("MExt_config", JSON.stringify(valueList));
    };
    let getValue = (name) => {
        return valueList[name];
    };
    let deleteValue = (name) => {
        delete valueList[name];
        localStorage.setItem("MExt_config", JSON.stringify(valueList));
    };
    $("head").append('<style id="MExt_CoreStyle"></style>');
    let appendStyle = (style) => {
        document.getElementById("MExt_CoreStyle").innerHTML += "\n" + style;
    };
    let getRequest = (variable, url = "") => {
        let query = url
            ? /\?(.*)/.exec(url)[1]
            : window.location.search.substring(1);
        let vars = query.split("&");
        for (let i = 0; i < vars.length; i++) {
            let pair = vars[i].split("=");
            if (pair[0] == variable) {
                return pair[1];
            }
        }
        return false;
    };
    // $("").on("DOMNodeInserted", ); polyfill实现
    let observe = function (selector, callback, options = {}) {
        const { subtree = true, once = false } = options;

        let target = document.querySelector(selector);
        let innerObserver = null;

        const bindObserver = () => {
            if (!target) return;

            // 防止重复绑定
            if (innerObserver) return;

            innerObserver = new MutationObserver((mutations) => {
                callback(target, mutations);

                if (once) {
                    innerObserver.disconnect();
                }
            });

            innerObserver.observe(target, {
                childList: true,
                subtree,
            });
        };

        // 初始查找
        bindObserver();

        // 如果目标未来才出现
        const rootObserver = new MutationObserver(() => {
            if (!target) {
                target = document.querySelector(selector);
                bindObserver();
            }
        });

        rootObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return {
            disconnect() {
                innerObserver?.disconnect();
                rootObserver.disconnect();
            },
        };
    };

    // 钩住DiscuzAjax函数,使其触发全局事件
    let __ajaxpost = ajaxpost;
    ajaxpost = (formid, showid, waitid, showidclass, submitbtn, recall) => {
        let relfunc = () => {
            if (typeof recall == "function") {
                recall();
            } else {
                eval(recall);
            }
            $(this).trigger("DiscuzAjaxPostFinished");
        };
        __ajaxpost(formid, showid, waitid, showidclass, submitbtn, relfunc);
    };
    let __ajaxget = ajaxget;
    ajaxget = (url, showid, waitid, loading, display, recall) => {
        let relfunc = () => {
            if (typeof recall == "function") {
                recall();
            } else {
                eval(recall);
            }
            $(this).trigger("DiscuzAjaxGetFinished");
        };
        __ajaxget(url, showid, waitid, loading, display, relfunc);
    };
    dlg("已注入Discuz ajax");

    // 编辑器小按钮行列
    const getEditorRows = (() => {
        function ensureId(el, index) {
            if (!el.id) {
                el.id = "e_adv_s3_row_" + index;
            }
        }

        function resolve() {
            const container = document.querySelector("#e_adv_s3");
            if (!container) return null;

            const rows = Array.from(container.querySelectorAll(":scope > p"));

            // 从后往前找最后一个 a 数量 < 2 的
            for (let i = rows.length - 1; i >= 0; i--) {
                const aCount = rows[i].querySelectorAll(":scope > a").length;
                if (aCount < 2) {
                    ensureId(rows[i], i);
                    return {
                        element: rows[i],
                        selector: "#" + rows[i].id,
                    };
                }
            }

            // 没有可用列，创建新列
            const newRow = document.createElement("p");
            container.appendChild(newRow);
            ensureId(newRow, rows.length);

            return {
                element: newRow,
                selector: "#" + newRow.id,
            };
        }

        return resolve;
    })();

    const isLogin = document.querySelector(
        'a[href^="member.php?mod=logging&action=login"]',
    )
        ? false
        : true;

    // 对外暴露API
    let MExt = {
        ValueStorage: {
            get: getValue,
            set: setValue,
            delete: deleteValue,
        },
        exportModule: exportModule,
        debugLog: dlg,
        observe,
        versionName: version,
        versionCode: vercode,
        jQuery: $,
        configList: configList,
        Units: {
            appendStyle: appendStyle,
            getRequest: getRequest,
            getEditorRows,
            isLogin,
        },
    };
    unsafeWindow.MExt = MExt;
    dlg("核心已加载");

    // 模块加载器
    let moduleLoader = (module) => {
        // 载入配置项
        if (typeof module.config !== "undefined") {
            module.config.forEach((v) => {
                if (typeof getValue(v.id) == "undefined") {
                    setValue(v.id, v.default);
                }
                let config = v;
                v.value = getValue(v.id);
                configList.push(config);
            });
        }
        // 判断是否应该运行
        if (typeof module.runcase == "function") {
            if (!module.runcase()) {
                return;
            }
        }
        // 加载模块CSS
        if (typeof module.style == "string") {
            appendStyle(module.style);
        }
        // 运行模块Core
        if (typeof module.core == "function") {
            module.core();
        }
    };
})();
