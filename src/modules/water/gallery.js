// Module: waterGallery 水楼图库工具（图片上传 + 本机图库管理）
// 与“发帖”彻底解耦：本模块只负责图片的存储、管理、上传（上传结果 aid 交给发帖模块使用），不负责发帖。
// 图库元数据存 localStorage（MExt_water_images），二进制存 IndexedDB（waterImage:<id>）。
(() => {
    const MExt = unsafeWindow.MExt;
    const $ = MExt.jQuery;
    const dlg = MExt.debugLog;
    const Stg = MExt.ValueStorage;
    const idb = MExt.Units.indexedDB;
    const observe = MExt.Units.observe;
    const discuz = MExt.Units.discuz;
    const isLogin = MExt.Units.isLogin;

    const LIST_KEY = "MExt_water_images"; // localStorage 元数据
    const IDB_PREFIX = "waterImage:"; // IndexedDB 二进制键前缀

    const escapeHtml = (s) =>
        String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        })[c]);

    // ---------------- 图库存储 ----------------
    function listImages() {
        try {
            const arr = JSON.parse(localStorage.getItem(LIST_KEY) || "[]");
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }
    function saveImages(arr) {
        localStorage.setItem(LIST_KEY, JSON.stringify(arr));
    }
    async function addImages(files) {
        const arr = listImages();
        let added = 0;
        for (const file of Array.from(files || [])) {
            if (!file) continue;
            const type = file.type || "image/jpeg";
            if (!/^image\//.test(type)) continue;
            const id = "w_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
            try {
                await idb.setItem(IDB_PREFIX + id, await file.arrayBuffer());
                arr.push({
                    id,
                    name: file.name || "image_" + id,
                    type,
                    size: file.size || 0,
                    time: Date.now(),
                });
                added++;
            } catch (e) {
                console.error("[MCBBS Extender] 图片写入失败:", e);
            }
        }
        saveImages(arr);
        return added;
    }
    async function removeImage(id) {
        try {
            await idb.removeItem(IDB_PREFIX + id);
        } catch (e) {}
        saveImages(listImages().filter((x) => x.id !== id));
    }
    async function clearImages() {
        for (const it of listImages()) {
            try {
                await idb.removeItem(IDB_PREFIX + it.id);
            } catch (e) {}
        }
        saveImages([]);
    }
    async function getRandomImage() {
        const arr = listImages();
        if (!arr.length) return null;
        const start = Math.floor(Math.random() * arr.length);
        for (let i = 0; i < arr.length; i++) {
            const meta = arr[(start + i) % arr.length];
            const buf = await idb.getItem(IDB_PREFIX + meta.id);
            if (buf) return { meta, buffer: buf };
        }
        return null;
    }
    function toFile(img) {
        return discuz.toFile(img);
    }
    // 上传单张图片，返回附件 id（aid）。发帖模块上传图片时调用它。
    async function uploadImage(file, cfg) {
        return discuz.uploadAttachment(file, cfg);
    }

    // ---------------- 图库 UI ----------------
    let thumbUrls = [];
    async function refreshUI() {
        const grid = document.querySelector("#waterGrid");
        const cnt = document.querySelector("#waterCount");
        const arr = listImages();
        if (cnt) cnt.textContent = arr.length;
        if (!grid) return;
        thumbUrls.forEach((u) => URL.revokeObjectURL(u));
        thumbUrls = [];
        grid.innerHTML = "";
        if (!arr.length) {
            grid.innerHTML = '<p class="waterEmpty">图库为空，先上传几张图片吧。</p>';
            return;
        }
        for (const meta of arr) {
            let url = "";
            try {
                const buf = await idb.getItem(IDB_PREFIX + meta.id);
                if (buf) {
                    url = URL.createObjectURL(
                        new Blob([buf], { type: meta.type || "image/jpeg" }),
                    );
                    thumbUrls.push(url);
                }
            } catch (e) {}
            const card = document.createElement("div");
            card.className = "waterCard";
            card.innerHTML =
                '<img class="waterThumb" src="' +
                url +
                '" alt="">' +
                '<div class="waterName" title="' +
                escapeHtml(meta.name) +
                '">' +
                escapeHtml(meta.name) +
                "</div>" +
                '<button class="waterDel" onclick="MExt.waterGallery.remove(\'' +
                meta.id +
                "');return false;\">删除</button>";
            grid.appendChild(card);
        }
    }

    function openGallery() {
        const html =
            '<div>' +
            '<h3 class="flb"><em>水楼图库</em><span><a href="javascript:;" class="flbc" onclick="hideWindow(\'water-gallery\')" title="关闭">关闭</a></span></h3>' +
            '<p class="waterBar">' +
            '<input type="file" id="waterFileInput" accept="image/*" multiple>' +
            '<button class="waterBtn" onclick="MExt.waterGallery.refreshUI()">刷新</button>' +
            '<button class="waterBtn" onclick="MExt.waterGallery.clearAll()">清空图库</button>' +
            "</p>" +
            '<p class="waterTip">图片仅保存在本机 IndexedDB，共 <b id="waterCount">0</b> 张。发帖请使用“水楼发帖”。</p>' +
            '<div id="waterGrid" class="waterGrid"></div>' +
            "</div>";
        if (typeof unsafeWindow.showWindow !== "function") {
            alert("当前页面无法打开图库窗口");
            return;
        }
        unsafeWindow.showWindow("water-gallery", html, "html");
        setTimeout(() => {
            const input = document.querySelector("#waterFileInput");
            if (input) {
                input.onchange = async () => {
                    const n = await addImages(input.files);
                    input.value = "";
                    dlg("已添加 " + n + " 张图片");
                    refreshUI();
                };
            }
            refreshUI();
        }, 60);
    }

    // ---------------- 模块定义 ----------------
    const waterGallery = {
        runcase: () => isLogin && Stg.get("waterGallery") !== false,
        config: [
            {
                id: "waterGallery",
                default: true,
                type: "check",
                name: "水楼图库",
                desc: "管理本机随机图库（IndexedDB），并向论坛上传图片获得附件 ID；不负责发帖。",
            },
        ],
        style: /* css */ ".waterBar { margin: 8px 0; }\n" +
            ".waterBtn { margin-right: 5px; }\n" +
            ".waterTip { color: #666; font-size: 12px; margin: 4px 0 8px; }\n" +
            ".waterGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 6px; max-height: 46vh; overflow-y: auto; padding-right: 4px; }\n" +
            ".waterCard { border: 1px solid #ddd; border-radius: 4px; padding: 4px; text-align: center; background: #fafafa; }\n" +
            ".waterThumb { width: 100%; height: 76px; object-fit: cover; border-radius: 3px; background: #eee; }\n" +
            ".waterName { font-size: 10px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 3px 0; }\n" +
            ".waterDel { font-size: 11px; }\n" +
            ".waterEmpty { color: #999; }\n",
        core: ($) => {
            dlg("水楼图库已加载");
            if (!isLogin) {
                dlg("未登录，已禁用图库工具");
                return;
            }
            MExt.waterGallery = {
                listImages,
                addImages,
                removeImage,
                clearImages,
                getRandomImage,
                toFile,
                uploadImage,
                openGallery,
                refreshUI,
                addFiles: async (files) => {
                    const n = await addImages(files);
                    await refreshUI();
                    return n;
                },
                remove: async (id) => {
                    await removeImage(id);
                    await refreshUI();
                },
                clearAll: async () => {
                    await clearImages();
                    await refreshUI();
                },
            };

            const addMenu = () => {
                const menu = document.querySelector("#userpanel .user_info_menu_btn");
                if (!menu || document.querySelector("#MExt_water")) return;
                const li = document.createElement("li");
                li.innerHTML =
                    '<a href="javascript:void(0);" id="MExt_water">水楼图库</a>';
                li.querySelector("a").onclick = openGallery;
                menu.appendChild(li);
            };
            addMenu();
            try {
                observe("#userpanel", addMenu);
            } catch (e) {}
        },
    };
    MExt.exportModule(waterGallery);
})();
