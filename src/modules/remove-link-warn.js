// Module: removeLinkWarn
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let removeLinkWarn = {
        runcase: () => {
            return MExt.ValueStorage.get("removeLinkWarn");
        },
        config: [
            {
                id: "removeLinkWarn",
                default: true,
                name: "移除外链警告",
                type: "check",
                desc: "去除论坛跳转外链时的警告页面.",
            },
        ],
        core: () => {
            if (typeof unsafeWindow.jumpToExternalLink === "function") {
                const __jump = unsafeWindow.jumpToExternalLink;

                unsafeWindow.jumpToExternalLink = function (link) {
                    try {
                        const u = new URL(link, location.href);

                        if (
                            /^https?:$/.test(u.protocol) &&
                            u.host !== location.host
                        ) {
                            window.open(
                                u.href,
                                "_blank",
                                "noopener,noreferrer",
                            );
                            dlg("已尝试覆写外链提示方法。");
                            return;
                        }
                    } catch {}

                    return __jump.apply(this, arguments);
                };
            }

            const isExternal = (href) => {
                try {
                    if (!href.trim().toLowerCase().startsWith("/")) {
                        const u = new URL(href, location.href);
                        if (u.protocol !== "https:" && u.protocol !== "http:") {
                            return false;
                        }
                        return u.host !== location.host;
                    } else {
                        return false;
                    }
                } catch {
                    return false;
                }
            };

            const hookLinks = () => {
                $("a[href]")
                    .not("[mext-link-fixed]")
                    .each((_, el) => {
                        const href = el.getAttribute("href");
                        if (!href || !isExternal(href)) return;

                        $(el)
                            .attr("mext-link-fixed", "1")
                            .on("click", (e) => {
                                // 阻止弹窗
                                e.preventDefault();
                                e.stopImmediatePropagation();

                                window.open(href, "_blank", "noopener");
                            });
                    });
            };

            hookLinks();
            $(document).on(
                "DiscuzAjaxGetFinished DiscuzAjaxPostFinished",
                hookLinks,
            );
            dlg("已尝试覆写页面链接跳转方法。");
            dlg("已激活移除外链警告。");
        },
    };
    MExt.exportModule(removeLinkWarn);
})();
