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
export default observe;
