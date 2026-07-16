// Module: 高级草稿箱
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;

    let module = {
        runcase: () => {
            return MExt.ValueStorage.get("editorDraft");
        },

        config: [
            {
                id: "editorDraft",
                default: true,
                type: "check",
                name: "高级草稿箱",
                desc: "启用后将会在帖子/编辑器页的用户菜单中添加草稿箱菜单，包含草稿列表和自动保存等功能",
            },
        ],

        style: /* css */ `
            .advDraftTable {
                width:100%;
                border-collapse:collapse;
                margin-top:10px;
            }

            .advDraftTable td,
            .advDraftTable th {
                border:1px solid #ddd;
                padding:5px;
                text-align:center;
            }

            .advDraftPreview {
                width:100%;
                height:120px;
                resize:none;
                margin-top:10px;
            }

            .advDraftTitle {
                width:90%;
            }

            .advDraftBtn {
                margin:2px;
            }
        `,

        core: () => {
            dlg("已启用高级草稿箱。");

            const STORE = "advDraft";

            function loadStore() {
                return Stg.get(STORE) || {};
            }
            function saveStore(data) {
                Stg.set(STORE, data);
            }

            MExt.advDraft = {};

            /**
             * 保存草稿
             */
            MExt.advDraft.save = function (id, title) {
                let drafts = loadStore();

                const currEditor = unsafeWindow?.wysiwyg ?? 1;

                const switchEditor = unsafeWindow.switchEditor;

                if (switchEditor) switchEditor(0);

                drafts[id] = {
                    id: id,
                    title: title,
                    content: unsafeWindow.advDraftTextarea.value,
                    time: Date.now(),
                };

                if (switchEditor) switchEditor(currEditor);

                saveStore(drafts);

            };

            /**
             * 删除
             */
            MExt.advDraft.remove = function (id) {
                unsafeWindow.showDialog(
                    "确定删除该草稿吗？删除后无法恢复。",
                    "confirm",
                    "删除草稿",
                    function () {
                        let drafts = loadStore();

                        delete drafts[id];

                        saveStore(drafts);

                        if (window.advDraftRefresh) {
                            advDraftRefresh();
                        }
                    },
                );
            };

            /**
             * 使用草稿
             */
            MExt.advDraft.use = function (id) {
                let drafts = loadStore();

                if (!drafts[id]) return;

                const currEditor = unsafeWindow?.wysiwyg ?? 1;

                const switchEditor = unsafeWindow.switchEditor;

                if (switchEditor) switchEditor(0);

                let ta = unsafeWindow.advDraftTextarea;

                if (ta) {
                    ta.value = drafts[id].content;
                }

                if (switchEditor) switchEditor(currEditor);
            };

            /**
             * 预览
             */
            MExt.advDraft.preview = function (id) {
                let drafts = loadStore();

                if (!drafts[id]) return;

                let box = document.querySelector("#advDraftPreview");

                if (box) {
                    box.value = drafts[id].content;
                }
            };

            /**
             * 覆盖
             */
            MExt.advDraft.cover = function (id,title) {
                unsafeWindow.showDialog(
                    "确定使用当前编辑器内容覆盖该草稿吗？",
                    "confirm",
                    "覆盖草稿",
                    function () {
                        MExt.advDraft.save(id,title)
                    },
                );
            };

            /**
             * 标题修改
             */
            MExt.advDraft.titleChange = function (id, value) {
                let drafts = loadStore();

                if (!drafts[id]) return;

                drafts[id].title = value;

                saveStore(drafts);
            };

            $(() => {
                let textarea = null;

                const simple = document.querySelector("#fastpostmessage");
                const advance = document.querySelector("#e_textarea");

                if (advance) {
                    textarea = advance;
                } else if (simple) {
                    textarea = simple;
                }

                console.log(`已识别到的编辑器实例：`, textarea);
                if (!textarea) return;

                unsafeWindow.advDraftTextarea = textarea;

                const control = document.createElement("li");

                control.innerHTML = /* html */ `<a href="javascript:void(0);" id="MExt_draft">草稿箱</a>`;

                document
                    .querySelector(".user_info_menu_btn")
                    ?.appendChild(control);

                control.onclick = () => {
                    let html = /*html*/ `
                        <div>
                        <h3>草稿箱</h3>
                        <label>
                        <input type="checkbox" id="advDraftAuto">
                        自动保存草稿
                        </label>
                        保存间隔：
                        <input id="advDraftInterval" type="number" value="10" min="1">
                        秒
                        <table class="advDraftTable">
                        <thead>
                        <tr>
                        <th>标题</th>
                        <th>操作</th>
                        </tr>
                        </thead>
                        <tbody id="advDraftRows">
                        </tbody>
                        </table>
                        <button class="advDraftBtn" onclick="MExt.advDraft.new()">新建</button>
                        <textarea id="advDraftPreview" class="advDraftPreview" readonly></textarea>
                        </div>
                    `;

                    unsafeWindow.showDialog(html, "info");

                    window.advDraftRefresh = function () {
                        let rows = document.querySelector("#advDraftRows");
                        if (!rows) return;
                        let drafts = loadStore();
                        rows.innerHTML = "";
                        Object.values(drafts).forEach((d) => {
                            let tr = document.createElement("tr");
                            tr.innerHTML = /*html*/ `
                                <td>
                                <input class="advDraftTitle" value="${d.title}" onchange="MExt.advDraft.titleChange('${d.id}',this.value)">
                                </td>
                                <td>
                                <button onclick="MExt.advDraft.preview('${d.id}')">预览</button>
                                <button onclick="MExt.advDraft.cover('${d.id}','${d.title}')">覆盖</button>
                                <button onclick="MExt.advDraft.use('${d.id}')">使用</button>
                                <button onclick="MExt.advDraft.remove('${d.id}')">删除</button>
                                </td>
                            `;
                            rows.appendChild(tr);
                        });
                    };
                    advDraftRefresh();
                    let auto = document.querySelector("#advDraftAuto");
                    let interval = document.querySelector("#advDraftInterval");
                    auto.onchange = function () {
                        Stg.set("advDraftAuto", this.checked);
                    };
                    interval.onchange = function () {
                        Stg.set("advDraftInterval", Number(this.value));
                    };
                    auto.checked = Stg.get("advDraftAuto") || false;
                    interval.value = Stg.get("advDraftInterval") || 10;
                };

                /**
                 * 新建
                 */
                MExt.advDraft.new = function () {
                    let id = String(Date.now());
                    MExt.advDraft.save(id, "新建草稿");
                    if (window.advDraftRefresh) advDraftRefresh();
                };

                /**
                 * 自动保存
                 */
                let lastAutoSave = 0;

                setInterval(() => {
                    if (!Stg.get("advDraftAuto")) return;

                    let sec = Number(Stg.get("advDraftInterval") || 10);

                    if (Date.now() - lastAutoSave < sec * 1000) return;

                    lastAutoSave = Date.now();

                    MExt.advDraft.save("AUTODRAFT", "自动保存");
                }, 1000);
            });
        },
    };

    MExt.exportModule(module);
})();
