// Module: hoverableMedal
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let hoverableMesdal = {
        runcase: () => {
            return MExt.ValueStorage.get("hoverableMedal");
        },
        config: [
            {
                id: "hoverableMedal",
                default: true,
                name: "玻璃质感勋章",
                type: "check",
                desc: "亮闪闪的勋章~",
            },
        ],
        style:
            /* css */ `.hoverable-medal:hover:after {
    margin-top: 0px!important;
    opacity: 1!important;
}

.hoverable-medal:after {
    display: block;
    content: '';
    margin-top: -15px;
    opacity: 0.6;
    transition-duration: .4s;
    background-image: url(` +
            MExt.staticRes.medalReflectImage +
            `);
    width: 100%;
    height: 100%;
    filter: blur(2px);
}

div.tip.tip_4[id*=_menu],
div.tip.tip_4[id*=md_] {
    width: 105px;
    height: 165px;
    border: none;
    box-shadow: black 0px 2px 10px -3px;
    margin-left: 38px;
    margin-top: 115px;
    background: black;
    overflow: hidden;
    pointer-events: none!important;
    border-radius: 5px;
    padding: 0px;
}

div.tip.tip_4[id*=_menu] .tip_horn,
div.tip.tip_4[id*=md_] .tip_horn {
    background-size: cover;
    background-position: center;
    height: 200%;
    width: 200%;
    z-index: -1;
    filter: blur(7px) brightness(0.8);
    top: -50%;
    left: -50%;
}

div.tip.tip_4[id*=_menu] .tip_c,
div.tip.tip_4[id*=md_] .tip_c {
    color: rgba(255, 255, 255, 0.98);
}

div.tip.tip_4[id*=_menu] h4,
div.tip.tip_4[id*=md_] h4 {
    text-align: center;
    padding: 10px 5px;
    background-color: rgba(255, 255, 255, 0.3);
}

div.tip.tip_4[id*=_menu] p,
div.tip.tip_4[id*=md_] p {
    padding: 0px 10px;
    position: absolute;
    top: calc(50% + 38px);
    transform: translateY(calc(-50% - 26px));
}

.md_ctrl {
    margin-left: 17px!important;
    padding-bottom: 15px;
}

.hoverable-medal {
    width: 31px;
    height: 53px;
    transition-duration: 0.4s;
    border-radius: 3px;
    display: inline-block;
    margin: 5px;
    background-position: center;
    box-shadow: 0px 2px 5px 0px black;
    overflow: hidden;
}

.hoverable-medal:hover {
    transform: matrix3d(1, 0, 0, 0, 0, 1, 0, -0.003, 0, 0, 1, 0, 0, -1.5, 0, 0.9);
    box-shadow: 0px 2px 10px -3px black;
}

.pg_medal .mgcl img {
    margin-top: 12px!important
}

.mg_img {
    box-shadow: inset 0 0 10px 4px rgba(0, 0, 0, 0.3);
    border-radius: 5px;
}
.md_ctrl:not([glassmedal]){
    display:none;
}`,
        core: () => {
            let rewriteMedal = () => {
                // 遍历所有未重写楼层
                $(".md_ctrl:not([glassmedal])")
                    .attr("glassmedal", "true")
                    .each((t, v) => {
                        // 遍历楼层所有勋章
                        $(v)
                            .children(0)
                            .children("img")
                            .each((b, n) => {
                                let medal = $(
                                    '<span class="hoverable-medal"></span>',
                                );

                                medal.css("background-image", `url(${n.src})`);

                                // 复制 id
                                if (n.id) {
                                    medal.attr("id", n.id);
                                }

                                // 第三方勋章
                                if (n.getAttribute("tip")) {
                                    medal.attr("tip", n.getAttribute("tip"));

                                    medal.on("mouseover", function () {
                                        MyshowTip(this);
                                    });
                                    $("#" + n.id + "_menu .tip_horn").css(
                                        "background-image",
                                        "url(" + n.src + ")",
                                    );
                                }
                                // 官方勋章
                                else {
                                    let match = /\_\d+$/.exec(n.id);

                                    if (!match) return;

                                    let id = "md" + match[0];

                                    medal.on("mouseover", () => {
                                        showMenu({
                                            ctrlid: n.id,
                                            menuid: id + "_menu",
                                            pos: "12!",
                                        });
                                    });

                                    $("#" + id + "_menu .tip_horn").css(
                                        "background-image",
                                        "url(" + n.src + ")",
                                    );
                                }

                                $(v).append(medal);

                                n.remove();
                            });
                    });
            };
            // patch: 将论坛自定义勋章移动到原生勋章容器中
            let patch = () => {
                $(".md_ctrl.wodexunzhang_img").each((i, ext) => {
                    if ($(ext).attr("merged-medal")) return;

                    let favatar = $(ext).closest(".favatar");

                    let target = favatar
                        .find(".md_ctrl")
                        .not(".wodexunzhang_img")
                        .first();

                    if (!target.length) return;

                    $(ext).find("img").appendTo(target.find("a").first());

                    $(ext).attr("merged-medal", "true");

                    $(ext).remove();
                });
            };
            $(patch);
            //调用重写勋章函数
            $(rewriteMedal);
            // 在Ajax时重新调用Ajax函数,保存勋章样式
            $(this).on(
                "DiscuzAjaxGetFinished DiscuzAjaxPostFinished",
                rewriteMedal,
            );
        },
    };
    MExt.exportModule(hoverableMesdal);
})();
