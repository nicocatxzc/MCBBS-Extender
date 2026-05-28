// Update Manager
(() => {
    let updatelist = [
        `插件原作者团队：<a href="https://github.com/Proj-MExt" target="_blank">Proj-MExt</a>`,
        "这是移植的第一版插件，未知或无效的功能已被禁用，可能仍然存在许多问题，欢迎随时反馈！",
    ];
    unsafeWindow.MExt.exportModule({
        core: () => {
            if (
                typeof unsafeWindow.MExt.ValueStorage.get("LastVersion") ==
                "undefined"
            ) {
                unsafeWindow.MExt.ValueStorage.set(
                    "LastVersion",
                    unsafeWindow.MExt.versionCode,
                );
                showDialog(
                    "<b>欢迎使用MCBBS Extender</b>.<br>本脚本的设置按钮已经放进入了您的个人信息菜单里,如需调整设置请在个人信息菜单里查看.<br><b>这是移植的第一版插件，未知或无效的功能已被禁用，可能仍然存在许多问题，欢迎随时反馈！</b><br>",
                    "right",
                    "欢迎",
                    () => {
                        showMenu("user_info");
                        unsafeWindow.MExt.jQuery("#MExt_config")
                            .css("background-color", "#E91E63")
                            .css("color", "#fff");
                        setTimeout(() => {
                            hideMenu("user_info_menu");
                            unsafeWindow.MExt.jQuery("#MExt_config")
                                .css("background-color", "")
                                .css("color", "");
                        }, 3000);
                    },
                );
                return;
            }
            if (
                unsafeWindow.MExt.ValueStorage.get("LastVersion") ==
                unsafeWindow.MExt.versionCode
            ) {
                return;
            }
            let updateContent = "";
            updatelist.forEach((v) => {
                updateContent += "<br>" + v;
            });
            showDialog(
                "<b>MCBBS Extender 已经更新至 " +
                    unsafeWindow.MExt.versionName +
                    "</b>" +
                    updateContent,
                "right",
            );
            unsafeWindow.MExt.ValueStorage.set(
                "LastVersion",
                unsafeWindow.MExt.versionCode,
            );
        },
    });
})();
