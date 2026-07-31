(() => {
    let ShouldRun = true;
    // jQuery检查
    if (typeof unsafeWindow.jQuery == "undefined") {
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
    let version = "v2.8.2";
    let vercode = 121302;
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

    const isLogin = document.querySelector(
        'a[href^="member.php?mod=logging&action=login"]',
    )
        ? false
        : true;

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
            module.core($);
        }
    };

    let trueJQ = true; // jquery版本需要确认

    let MExtModules = [];

    try {
        // 需要确认的方法
        unsafeWindow.jQuery("body")?.on(() => {});
        dlg("jQuery检查通过");
        console.log(unsafeWindow.jQuery());
    } catch (err) {
        trueJQ = false; // 方法校验不通过
        const script = document.createElement("script");
        script.src = "/template/mcbbs_v2/images/js/jquery-3.7.1.min.js?mext";
        script.onload = () => {
            $ = unsafeWindow.jQuery.noConflict();
            trueJQ = true;
            dlg("jQuery更新成功");
            console.log($());
            while (MExtModules.length) {
                const module = MExtModules.shift();
                exportModule(module);
            }
        };
        document.body.appendChild(script);
    }

    // 导出模块
    let exportModule = (...modules) => {
        if (!ShouldRun) {
            return;
        }
        if (trueJQ) {
            for (let m of modules) {
                try {
                    moduleLoader(m);
                } catch (e) {
                    console.error("加载模块时发生错误:\n" + e);
                }
            }
        } else {
            MExtModules.push(...modules);
        }
    };

    // 对外暴露API
    let MExt = {
        ValueStorage: {
            get: getValue,
            set: setValue,
            delete: deleteValue,
        },
        exportModule: exportModule,
        debugLog: dlg,
        versionName: version,
        versionCode: vercode,
        get jQuery() {
            return $;
        },
        configList: configList,
        Units: {
            appendStyle: appendStyle,
            getRequest: getRequest,
            isLogin,
        },
    };
    unsafeWindow.MExt = MExt;
    dlg("核心已加载");
})();
