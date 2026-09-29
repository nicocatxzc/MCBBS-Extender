// Module: autoWater 自动水贴
// 依赖：IndexedDB 图库 + Discuz 附件上传（misc.php?mod=swfupload）
// 说明：Discuz 上传附件后返回附件 id（aid），在帖子正文中写入 [attachimg]aid[/attachimg] 即可内嵌图片。
(() => {
    let MExt = unsafeWindow.MExt;
    let $ = MExt.jQuery;
    let dlg = MExt.debugLog;
    let Stg = MExt.ValueStorage;
    let idb = MExt.Units.indexedDB;
    let observe = MExt.Units.observe;
    const isLogin = MExt.Units.isLogin;

    const LIST_KEY = "MExt_water_images"; // localStorage 元数据
    const IDB_PREFIX = "waterImage:"; // IndexedDB 二进制键前缀
    const WATER_DAY = "autoWaterLastDate";
    const WATER_VER = "autoWaterDataVersion";
    const WATER_VER_NOW = "1";
    const WATER_LOCK = "autoWaterLock";
    const ATTEMPT_KEY = "autoWaterLastAttempt";

    const todayStr = () => new Date().toDateString();
    const escapeHtml = (s) =>
        String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        })[c]);

    const getConfig = (k, d) => {
        const v = Stg.get(k);
        return v === undefined || v === null || v === "" ? d : v;
    };
    const getTid = () => String(getConfig("autoWaterTid", "94")).replace(/\D/g, "") || "94";
    const getFid = () => String(getConfig("autoWaterFid", "2")).replace(/\D/g, "") || "2";
    const getMessage = () => getConfig("autoWaterMessage", "每日一图，水一贴~");

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
        const type = img.meta.type || "image/jpeg";
        const name = img.meta.name || "water.jpg";
        return new File([img.buffer], name, { type });
    }

    // ---------------- 解析帖子页参数 ----------------
    function parseUploadConfig(html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const form = doc.querySelector("#fastpostform");
        const action = form ? form.getAttribute("action") || "" : "";
        const fidM = /fid=(\d+)/.exec(action);
        const uploadUrlM = /"?upload_url"?\s*:\s*"([^"]+)"/.exec(html);
        const paramsM = /"?post_params"?\s*:\s*\{([^}]*)\}/.exec(html);
        let uid = "";
        let hash = "";
        if (paramsM) {
            const u = /"?uid"?\s*:\s*"([^"]*)"/.exec(paramsM[1]);
            const h = /"?hash"?\s*:\s*"([^"]*)"/.exec(paramsM[1]);
            uid = u ? u[1] : "";
            hash = h ? h[1] : "";
        }
        const formhashEl = form && form.querySelector('input[name="formhash"]');
        const posttimeEl = form && form.querySelector('input[name="posttime"]');
        return {
            uploadUrl: uploadUrlM
                ? uploadUrlM[1]
                : "/misc.php?mod=swfupload&action=swfupload&operation=upload&fid=" + (fidM ? fidM[1] : getFid()),
            uid,
            hash,
            fid: fidM ? fidM[1] : getFid(),
            formhash: formhashEl ? formhashEl.value : "",
            posttime: posttimeEl ? posttimeEl.value : String(Math.floor(Date.now() / 1000)),
            action:
                action ||
                "forum.php?mod=post&action=reply&fid=" +
                    getFid() +
                    "&tid=" +
                    getTid() +
                    "&replysubmit=yes&infloat=yes&handlekey=fastpost",
            tid: getTid(),
        };
    }

    // ---------------- 上传附件 ----------------
    async function uploadImage(file, cfg) {
        if (!cfg.uploadUrl || !cfg.uid || !cfg.hash) {
            throw new Error("无法获取附件上传参数");
        }
        const fd = new FormData();
        fd.append("uid", cfg.uid);
        fd.append("hash", cfg.hash);
        fd.append("Filedata", file, file.name);
        const res = await fetch(cfg.uploadUrl, {
            method: "POST",
            body: fd,
            credentials: "include",
        });
        const text = (await res.text()).trim();
        const aid = parseInt(text, 10);
        if (!aid || aid <= 0) {
            throw new Error("附件上传失败：" + text.slice(0, 200));
        }
        return aid;
    }

    // ---------------- 与自动任务联动 ----------------
    function linkAutoTask() {
        const at = MExt.autoTask;
        if (!at) return;
        try {
            at.applyTasks && at.applyTasks();
        } catch (e) {
            console.error(e);
        }
        try {
            at.checkTasks && at.checkTasks();
        } catch (e) {
            console.error(e);
        }
    }

    // ---------------- 静默水贴 ----------------
    async function silentWater(force) {
        if (!isLogin) return { ok: false, reason: "not-login" };
        if (!force && Stg.get(WATER_DAY) === todayStr()) {
            return { ok: false, reason: "done" };
        }
        const img = await getRandomImage();
        if (!img) return { ok: false, reason: "no-images" };

        const lock = Number(localStorage.getItem(WATER_LOCK) || 0);
        if (Date.now() - lock < 120000) {
            return { ok: false, reason: "locked" };
        }
        localStorage.setItem(WATER_LOCK, String(Date.now()));
        try {
            const tid = getTid();
            const res = await fetch("forum.php?mod=viewthread&tid=" + tid, {
                credentials: "include",
            });
            const html = await res.text();
            const cfg = parseUploadConfig(html);
            if (!cfg.formhash) {
                return { ok: false, reason: "no-formhash" };
            }
            dlg("静默水贴：正在上传随机图片...");
            const aid = await uploadImage(toFile(img), cfg);
            const message = getMessage() + "\n[attachimg]" + aid + "[/attachimg]";
            const fd = new FormData();
            fd.append("formhash", cfg.formhash);
            fd.append("posttime", cfg.posttime);
            fd.append("subject", "  ");
            fd.append("usesig", "1");
            fd.append("message", message);
            fd.append("replysubmit", "yes");
            fd.append("infloat", "yes");
            fd.append("handlekey", "fastpost");
            fd.append("attachnew[" + aid + "][description]", "");
            fd.append("attachnew[" + aid + "][readperm]", "");
            const post = await fetch(cfg.action, {
                method: "POST",
                body: fd,
                credentials: "include",
            });
            const text = await post.text();
            if (/succeedhandle_fastpost/.test(text)) {
                Stg.set(WATER_DAY, todayStr());
                dlg("静默水贴成功，aid=" + aid);
                linkAutoTask();
                return { ok: true, aid };
            }
            dlg("静默水贴失败：" + text.replace(/\s+/g, " ").slice(0, 150));
            return { ok: false, reason: "post-failed", body: text.slice(0, 500) };
        } catch (e) {
            console.error(e);
            dlg("静默水贴异常：" + e);
            return { ok: false, reason: "error", error: String(e) };
        } finally {
            localStorage.setItem(WATER_LOCK, "0");
        }
    }

    // ---------------- 半自动水贴 ----------------
    // 半自动：脚本完成“上传图片 + 插入附件与 [attachimg] 标签”，由用户点击发表回复。
    async function semiWater() {
        if (!isLogin) return;
        const form = document.querySelector("#fastpostform");
        if (!form) return;
        if (Stg.get(WATER_DAY) === todayStr()) {
            dlg("今日已水贴，跳过半自动水贴");
            return;
        }
        const action = form.getAttribute("action") || "";
        const tidM = /tid=(\d+)/.exec(action) || /tid-(\d+)/.exec(location.href);
        if (tidM && String(tidM[1]) !== getTid()) return;

        const img = await getRandomImage();
        if (!img) {
            dlg("图库为空，跳过半自动水贴");
            return;
        }
        const cfg = parseUploadConfig(document.documentElement.outerHTML);
        if (!cfg.formhash || !cfg.uploadUrl) {
            dlg("半自动水贴：无法获取发帖参数");
            return;
        }
        dlg("半自动水贴：正在上传随机图片...");
        let aid;
        try {
            aid = await uploadImage(toFile(img), cfg);
        } catch (e) {
            console.error(e);
            dlg("半自动水贴上传失败：" + e);
            return;
        }
        // 注入附件行（含 attachnew[aid][...] 隐藏字段，供提交时关联附件）
        try {
            const attachHtml = await (
                await fetch(
                    "forum.php?mod=ajax&action=attachlist&aids=" +
                        aid +
                        "&fid=" +
                        cfg.fid +
                        "&result=simple",
                    { credentials: "include" },
                )
            ).text();
            const box = document.querySelector("#attachlist");
            if (box && attachHtml.trim()) box.innerHTML = attachHtml;
        } catch (e) {
            console.error(e);
        }
        const ta = document.querySelector("#fastpostmessage");
        const tag = "[attachimg]" + aid + "[/attachimg]";
        if (ta && ta.value.indexOf(tag) < 0) {
            ta.value = (ta.value ? ta.value.replace(/\s*$/, "\n") : "") + tag;
            ta.dispatchEvent(new Event("input", { bubbles: true }));
        }
        pendingAid = aid;
        bindSemiResult();
        const btn = document.querySelector("#fastpostsubmit");
        if (btn) {
            btn.style.boxShadow = "0 0 8px 2px #ffbf00";
            btn.title = "已自动上传随机图片，点击发表回复即可完成每日水贴";
        }
        dlg("半自动水贴：图片与标签已就绪，请点击“发表回复”");
    }

    let pendingAid = null;
    let semiBound = false;
    function bindSemiResult() {
        if (semiBound) return;
        semiBound = true;
        const win = unsafeWindow;
        if (typeof win.succeedhandle_fastpost === "function") {
            const orig = win.succeedhandle_fastpost;
            win.succeedhandle_fastpost = function () {
                if (pendingAid) {
                    Stg.set(WATER_DAY, todayStr());
                    pendingAid = null;
                    dlg("半自动水贴成功");
                    linkAutoTask();
                }
                return orig.apply(this, arguments);
            };
        }
        if (typeof win.errorhandle_fastpost === "function") {
            const origErr = win.errorhandle_fastpost;
            win.errorhandle_fastpost = function () {
                pendingAid = null;
                return origErr.apply(this, arguments);
            };
        }
        // 兜底：Discuz ajax 完成事件
        $(document).on("DiscuzAjaxPostFinished", function () {
            if (pendingAid) {
                Stg.set(WATER_DAY, todayStr());
                pendingAid = null;
                dlg("半自动水贴完成（事件确认）");
                linkAutoTask();
            }
        });
    }

    // ---------------- 图库 UI ----------------
    let thumbUrls = [];
    async function refreshUI() {
        const grid = document.querySelector("#waterGrid");
        const cnt = document.querySelector("#waterCount");
        const last = document.querySelector("#waterLastDate");
        if (last) last.textContent = Stg.get(WATER_DAY) || "从未";
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
                '<button class="waterDel" onclick="MExt.autoWater.remove(\'' +
                meta.id +
                "');return false;\">删除</button>";
            grid.appendChild(card);
        }
    }

    function openGallery() {
        const html =
            '<div>' +
            '<h3 class="flb"><em>水楼随机图库</em><span><a href="javascript:;" class="flbc" onclick="hideWindow(\'water-gallery\')" title="关闭">关闭</a></span></h3>' +
            '<p class="waterBar">' +
            '<input type="file" id="waterFileInput" accept="image/*" multiple>' +
            '<button class="waterBtn" onclick="MExt.autoWater.silentWater(true)">立即发一贴</button>' +
            '<button class="waterBtn" onclick="MExt.autoWater.refreshUI()">刷新</button>' +
            '<button class="waterBtn" onclick="MExt.autoWater.clearAll()">清空图库</button>' +
            "</p>" +
            '<p class="waterTip">图片仅保存在本机 IndexedDB。上次成功水贴：<b id="waterLastDate"></b>　共 <b id="waterCount">0</b> 张</p>' +
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
    let autoWater = {
        runcase: () => true,
        config: [
            {
                id: "autoWater",
                default: true,
                type: "check",
                name: "自动水贴（半自动）",
                desc: "打开水楼页面时自动上传一张随机图片并填入回复框，由你点击“发表回复”完成。",
            },
            {
                id: "autoWaterSilent",
                default: true,
                type: "check",
                name: "后台静默水贴",
                desc: "无需打开水楼页面，后台静默完成上传与发帖；优先于半自动。可在“水楼图库”中管理图片。",
            },
            {
                id: "autoWaterTid",
                default: "94",
                type: "text",
                name: "水楼帖子 ID",
                desc: "每日自动水贴的目标帖子 tid，默认为 94。",
            },
            {
                id: "autoWaterFid",
                default: "2",
                type: "text",
                name: "水楼版块 ID",
                desc: "目标帖子所在版块的 fid，默认为 2。",
            },
            {
                id: "autoWaterMessage",
                default: "每日一图，水一贴~",
                type: "textarea",
                name: "水贴内容",
                desc: "每次水贴的正文，脚本会在末尾自动附加随机图片的 [attachimg] 标签。",
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
            dlg("自动水贴已加载");
            if (!isLogin) {
                dlg("未登录，已禁用自动水贴");
                return;
            }
            // 数据迁移
            if (Stg.get(WATER_VER) !== WATER_VER_NOW) {
                Stg.delete(WATER_DAY);
                Stg.set(WATER_VER, WATER_VER_NOW);
            }

            MExt.autoWater = {
                listImages,
                addImages,
                removeImage,
                clearImages,
                getRandomImage,
                silentWater,
                semiWater,
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

            // 用户菜单入口
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

            const runAuto = async () => {
                const silentOn = Stg.get("autoWaterSilent");
                const semiOn = Stg.get("autoWater");
                if (!silentOn && !semiOn) return;
                if (Stg.get(WATER_DAY) === todayStr()) return;

                if (silentOn) {
                    const lastAttempt = Number(localStorage.getItem(ATTEMPT_KEY) || 0);
                    if (Date.now() - lastAttempt < 5 * 60 * 1000) return;
                    localStorage.setItem(ATTEMPT_KEY, String(Date.now()));
                    const r = await silentWater(false);
                    if (r.ok || r.reason === "done") return;
                    dlg("静默水贴未完成（" + r.reason + "），尝试半自动");
                }
                if (semiOn && document.querySelector("#fastpostform")) {
                    await semiWater();
                }
            };

            $(() => {
                setTimeout(() => {
                    runAuto().catch((e) => console.error(e));
                }, 1200);
            });
        },
    };
    MExt.exportModule(autoWater);
})();
