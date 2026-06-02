// Module: homepage-slide
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;

    let homepageSlide = {
        runcase: () => {
            return MExt.ValueStorage.get("homepageSlide");
        },
        config: [
            {
                id: "homepageSlide",
                default: true,
                name: "滚动首页轮播",
                type: "check",
                desc: "将首页轮播图的播放方式改为滚动.",
            },
        ],
        style: /* css */ `
.slideshow li[data-pos] {
    display:block!important;
    position: absolute;
    transition: ease 1s;
}

.slideshow li[data-pos="0"] {
    transform: translateX(0);
    opacity: 1;
}

.slideshow li[data-pos="-1"] {
    transform: translateX(-100%);
}

.slideshow li[data-pos="1"] {
    transform: translateX(100%);
}

.slideshow li[data-pos="-2"] {
    transform: translateX(-200%);
}

.slideshow li[data-pos="2"] {
    transform: translateX(200%);
}

.slideshow li[data-pos="3"] {
    transform: translateX(200%);
    display:none!important;
}

.slideshow li[data-pos="-3"] {
    transform: translateX(-200%);
    display:none!important;
}
        `,
        core: () => {
            if(!document.querySelector(".slidebox li")) {
                return;
            }
            function patchSlide() {
                dlg("已启用首页滚动轮播。");

                console.log(unsafeWindow.slideshow?.entities);
                if (!unsafeWindow.slideshow?.entities) {
                    setTimeout(patchSlide, 100);
                    return;
                }

                Object.values(slideshow.entities).forEach((instance) => {
                    // instance?.stop()
                    instance.active = function (index) {
                        const len = this.slideshows.length;

                        this.slideshows.forEach((slide, i) => {
                            let pos = i - index;

                            if (pos > len / 2) pos -= len;

                            if (pos < -len / 2) pos += len;

                            if (pos > 3) {
                                pos = 3;
                            }
                            if (pos < -3) {
                                pos = -3;
                            }
                            slide.dataset.pos = pos;
                        });

                        if (this.controls?.length) {
                            this.controls[this.index]?.classList.remove("on");
                            this.controls[index]?.classList.add("on");
                        }

                        this.index = index;
                    };
                    instance.index = 0;
                    instance.active(0);
                });
                // runslideshow()
            }

            patchSlide();
        },
    };
    MExt.exportModule(homepageSlide);
})();
