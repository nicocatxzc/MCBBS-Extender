// Module: animationGoToTop
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let animationGoToTop = {
        runcase: () => {
            let href = window.location.href
            // 不适配门户页
            if(href.endsWith("portal.php")) {
                return false
            } else {
                return MExt.ValueStorage.get("animateGoToTopButton");
            }
        },
        config: [
            {
                id: "animateGoToTopButton",
                default: true,
                name: "回到顶部按钮美化",
                type: "check",
                desc: "为右侧回到顶部按钮增加动画以及位置修正.",
            },
        ],
        style: /* css */ `
.scrolltopa {
    transform: translateX(-100%);
    clip-path: inset(0 0 0 100%);
}
.scrolltopashow {
    transform: translateX(0);
    clip-path: inset(0 0 0 0);
}
html {
    scroll-behavior: smooth;
}
`,
        core: ($) => {
            let __showTopLink = unsafeWindow.showTopLink;

            unsafeWindow.showTopLink = (...args) => {
                __showTopLink?.apply(this, args);

                let ft = $("#ft")[0];
                if (ft) {
                    let scrolltop = $("#scrolltop")[0];
                    if (!scrolltop) {
                        return false;
                    }
                    let scrolltopbtn = $(".scrolltopa");
                    let scrollHeight = parseInt(
                        document.body.getBoundingClientRect().top,
                    );
                    if (scrollHeight < -100) {
                        scrolltopbtn.addClass("scrolltopashow");
                    } else {
                        scrolltopbtn.removeClass("scrolltopashow");
                    }
                }
            };
            showTopLink();
        },
    };
    MExt.exportModule(animationGoToTop);
})();
