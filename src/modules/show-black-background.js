// Module: showBlackBackground
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let showBlackBackground = {
        runcase: () => MExt.ValueStorage.get("showBlackBackground"),

        config: [
            {
                id: "showBlackBackground",
                default: true,
                type: "check",
                name: "低对比度文字高亮显示",
                desc: "鼠标悬浮在低对比度文本上自动高亮显示文字",
            },
        ],
        style: /*css */ `
        .mext-black:hover {
            color:black!important;
        }
        .mext-white:hover {
            color:white!important;
        }
        `,

        core: ($) => {
            dlg("显示黑幕已启用。");
            function channelToLinear(value) {
                const c = value / 255;
                return c <= 0.03928
                    ? c / 12.92
                    : Math.pow((c + 0.055) / 1.055, 2.4);
            }
            function getLuminance(r, g, b) {
                const R = channelToLinear(r);
                const G = channelToLinear(g);
                const B = channelToLinear(b);
                return 0.2126 * R + 0.7152 * G + 0.0722 * B;
            }
            function getContrast(rgb1, rgb2) {
                const L1 = getLuminance(...rgb1);
                const L2 = getLuminance(...rgb2);

                const lighter = Math.max(L1, L2);
                const darker = Math.min(L1, L2);

                return (lighter + 0.05) / (darker + 0.05);
            }
            function getEffectiveBackground(element) {
                let el = element;
                while (el && el !== document.documentElement) {
                    const bg = getComputedStyle(el).backgroundColor;
                    if (
                        bg &&
                        bg !== "rgba(0, 0, 0, 0)" &&
                        bg !== "transparent"
                    ) {
                        return bg;
                    }
                    el = el.parentElement;
                }
                return "rgb(255,255,255)";
            }
            function parseRGB(str) {
                const result = str.match(/\d+/g).map(Number);
                return [result[0], result[1], result[2]];
            }

            function autoTextColor(element) {
                const bg = getEffectiveBackground(element);
                const bgRGB = parseRGB(bg);

                const black = [0, 0, 0];
                const white = [255, 255, 255];

                const contrastWithBlack = getContrast(bgRGB, black);
                const contrastWithWhite = getContrast(bgRGB, white);

                const currentColor = parseRGB(getComputedStyle(element).color);
                const contrast = getContrast(bgRGB, currentColor);

                const color =
                    contrastWithBlack > contrastWithWhite
                        ? "mext-black"
                        : "mext-white";

                if (contrast < 2.5) {
                    element.classList.add(color);
                }
            }
            setTimeout(() => {
                $("font").each((i, el) => {
                    autoTextColor(el);
                });
            }, 0);
        },
    };
    MExt.exportModule(showBlackBackground);
})();
