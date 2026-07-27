// Module: 通用模块模板
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let indexedDB = MExt.Units.indexedDB;
    let module = {
        runcase: () => {
            return true;
        },
        config: [
            {
                id: "customBackground",
                default: "",
                type: "text",
                name: "自定义背景图",
                desc: /* html */ `输入图片链接或<a href="#" onclick="
                    window.showOpenFilePicker().then(async ([fileHandle]) => {
                        const file = await fileHandle.getFile();
                        document.dispatchEvent(new CustomEvent('MExtPickBackground', {
                            detail: file
                        }));
                    });;
                    ">点击此处</a>以设置自定义背景图`,
            },
        ],
        style: /* css */ `
// css
`,
        core: ($) => {
            // start
            dlg("Module enabled。");

            const BACKGROUND_KEY = "MExt_custom_background";
            async function openFilePicker() {
                try {
                    // 直接呼出文件选择器
                    const [fileHandle] = await window.showOpenFilePicker();
                    // 获取文件内容
                    const file = await fileHandle.getFile();
                    const content = await file.arrayBuffer();
                    return file;
                } catch (err) {
                    return false;
                }
            }

            $(async() => {
                // 监听事件
                document.addEventListener("MExtPickBackground", async (e) => {
                    const file = e.detail;

                    const input = document.querySelector(
                        "#in_customBackground",
                    );

                    if (input) {
                        if (file) {
                            MExt.ValueStorage.set(BACKGROUND_KEY, file.name);

                            await indexedDB.setItem(
                                BACKGROUND_KEY,
                                await file.arrayBuffer(),
                            );

                            input.value = file.name;
                        } else {
                            MExt.ValueStorage.set(BACKGROUND_KEY, "");
                            input.value = "";
                        }
                    }
                });
                // 配置背景
                const config = MExt.ValueStorage.get("customBackground");
                if (config) {
                    const body = document.querySelector("#body_fixed_bg");
                    console.log(body)
                    if (config.startsWith("http")) {
                        body.style.backgroundImage = `url("${config}")`;
                    } else {
                        const file = await indexedDB.getItem(BACKGROUND_KEY);
                        console.log(file)
                        const blob = new Blob([file], { type: "image/jpeg" });
                        console.log(blob)
                        const image = URL.createObjectURL(blob);
                        console.log(image)
                        body.style.backgroundImage = `url("${image}")`;
                    }
                }
            });

        },
    };
    MExt.exportModule(module);
})();
