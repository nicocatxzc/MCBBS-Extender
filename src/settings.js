// Settings
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let Md = {
        style: /* css */ `.conf_contain {
            max-height: 45vh;
            overflow-y: auto;
            padding-right: 5px;
            overflow-x: hidden;
            scrollbar-color: rgba(0, 0, 0, 0.17) #f7f7f7;
            scrollbar-width: thin;
        }

        .alert_info ::-webkit-scrollbar {
            background: #f7f7f7;
            height: 7px;
            width: 7px
        }

        .alert_info ::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.35);
        }

        .alert_info ::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.17);
        }

        .conf_item {
            line-height: 1.2;
            margin-bottom: 5px;
        }

        .conf_title {
            font-weight: 1000;
        }

        .conf_subtitle {
            font-size: 10px;
            color: rgba(0, 0, 0, 0.5);
            padding-right: 40px;
            display: block;
        }

        .conf_check {
            float: right;
            margin-top: -25px;
        }

        .conf_input {
            float: right;
            width: 30px;
            margin-top: -27px;
        }

        .conf_longinput {
            width: 100%;
            margin-top: 5px;
        }

        .conf_textarea {
            width: calc(100% - 4px);
            margin-top: 5px;
            resize: vertical;
            min-height: 50px;
        }`,
        core: () => {
            let getRequest = MExt.Units.getRequest;
            $(() => {
                // 发送警告
                if (
                    location.pathname == "/forum.php" &&
                    getRequest("mod") == "post" &&
                    getRequest("action") == "newthread" &&
                    getRequest("fid") == "100"
                ) {
                    $("body").append(
                        $(
                            `<div id="close_script_alert" style="max-width:430px;position: fixed; left: 20px; top: 80px; z-index: 9999; transform: matrix3d(1, 0, 0, 0.0001, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1.025) translateX(-120%); background: rgba(228, 0, 0, 0.81); color: white; padding: 15px; transition-duration: 0.3s; border-radius: 5px; box-shadow: rgba(0, 0, 0, 0.66) 2px 2px 5px 0px;"><h1 style="font-size: 3em;float: left;margin-right: 12px;font-weight: 500;margin-top: 6px;">警告</h1><span style="font-size: 1.7em;">您正在向反馈与投诉版发表新的帖子</span><br>如果您正在向论坛报告论坛内的Bug,请先关闭此脚本再进行一次复现,以确保Bug不是由MCBBS Extender造成的.</div>`,
                        ),
                    );
                    setTimeout(() => {
                        $("#close_script_alert")[0].style.transform =
                            "matrix3d(1, 0, 0, 0.0001, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1.025)";
                    }, 10);
                    setTimeout(() => {
                        $("#close_script_alert")[0].style.transform = "none";
                    }, 300);
                    setTimeout(() => {
                        $("#close_script_alert")[0].style.transform =
                            "translateX(-120%)";
                    }, 10000);
                    MExt.debugLog("Warning send");
                }
                // 设置界面初始化
                $("#userpanel .user_info_menu_btn").append(
                    "<li><a href='javascript: void(0);' id=\"MExt_config\">MCBBS Extender 设置</a></li>",
                );
                let confwinContent =
                    '<style>body{overflow:hidden}.altw{width:700px;max-width:95vw;}.alert_info {background-image: unset;padding-left: 20px;padding-right: 17px;}</style><div class="conf_contain">';
                let inputType = {
                    check: "",
                    num: "",
                    text: "",
                    textarea: "",
                };
                MExt.configList.forEach((v) => {
                    switch (v.type) {
                        case "check":
                            inputType.check +=
                                '<p class="conf_item"><span class="conf_title">' +
                                v.name +
                                '</span><br><span class="conf_subtitle">' +
                                v.desc +
                                '</span><input class="conf_check" type="checkbox" id="in_' +
                                v.id +
                                '"></input></p>';
                            break;
                        case "num":
                            inputType.num +=
                                '<p class="conf_item"><span class="conf_title">' +
                                v.name +
                                '</span><br><span class="conf_subtitle">' +
                                v.desc +
                                '</span><input type="number" class="conf_input" id="in_' +
                                v.id +
                                '"></input></p>';
                            break;
                        case "text":
                            inputType.text +=
                                '<p class="conf_item"><span class="conf_title">' +
                                v.name +
                                '</span><br><span class="conf_subtitle">' +
                                v.desc +
                                '</span><input type="text" class="conf_longinput" id="in_' +
                                v.id +
                                '"></input></p>';
                            break;
                        case "textarea":
                            inputType.textarea +=
                                '<p class="conf_item"><span class="conf_title">' +
                                v.name +
                                '</span><br><span class="conf_subtitle">' +
                                v.desc +
                                '</span><textarea class="conf_textarea" id="in_' +
                                v.id +
                                '"></textarea></p>';
                            break;
                        default:
                            inputType.check +=
                                '<p class="conf_item"><span class="conf_title">' +
                                v.name +
                                '</span><br><span class="conf_subtitle">' +
                                v.desc +
                                '</span><input class="conf_check" type="checkbox" id="in_' +
                                v.id +
                                '"></input></p>';
                            break;
                    }
                });
                confwinContent +=
                    inputType.check +
                    inputType.num +
                    inputType.text +
                    inputType.textarea +
                    "</div>";
                MExt.debugLog("已载入设置窗口。");
                $("#MExt_config").on("click", () => {
                    unsafeWindow.showDialog(
                        confwinContent,
                        "confirm",
                        'MCBBS Extender 设置 <a href="https://github.com/nicocatxzc/MCBBS-Extender/" target="_blank" style="margin-left: 15px;color: #369;text-decoration: underline;">插件主页</a><a href="https://github.com/nicocatxzc/MCBBS-Extender/issues/new" target="_blank" style="margin-left: 15px;color: #369;text-decoration: underline;">反馈问题</a>',
                        () => {
                            MExt.configList.forEach((v) => {
                                let val = "";
                                if (
                                    v.type == "num" ||
                                    v.type == "text" ||
                                    v.type == "textarea"
                                ) {
                                    val = $("#in_" + v.id).val();
                                } else {
                                    val = $("#in_" + v.id).prop("checked");
                                }
                                MExt.ValueStorage.set(v.id, val);
                            });
                            setTimeout(() => {
                                unsafeWindow.showDialog(
                                    "设置已保存,刷新生效<style>.alert_info{background:url(https://www.mcbbs.net/template/mcbbs/image/right.gif) no-repeat 8px 8px}</style>",
                                    "confirm",
                                    "",
                                    () => {
                                        location.reload();
                                    },
                                    true,
                                    () => {},
                                    "",
                                    "刷新",
                                    "确定",
                                );
                            });
                        },
                        true,
                        () => {},
                        "MCBBS Extender " +
                            MExt.versionName +
                            '- Modified By <a href="https://github.com/nicocatxzc" target="_blank" style="color:#fabe03!important;">nicocat</a>',
                    );
                    MExt.configList.forEach((v) => {
                        if (
                            v.type == "num" ||
                            v.type == "text" ||
                            v.type == "textarea"
                        ) {
                            $("#in_" + v.id).val(MExt.ValueStorage.get(v.id));
                        } else {
                            $("#in_" + v.id).prop(
                                "checked",
                                MExt.ValueStorage.get(v.id),
                            );
                        }
                    });
                });
            });
        },
    };
    MExt.exportModule(Md);
})();
