// Module: waterPost 水楼发帖工具（正文自定义 + 手动/一键发帖）
// 与图库解耦：图片上传交给 MExt.waterGallery.uploadImage，本模块只负责组帖与发帖、并联动任务领奖。
(() => {
    const MExt = unsafeWindow.MExt;
    const $ = MExt.jQuery;
    const dlg = MExt.debugLog;
    const Stg = MExt.ValueStorage;
    const discuz = MExt.Units.discuz;
    const observe = MExt.Units.observe;
    const isLogin = MExt.Units.isLogin;

    const WATER_DAY = "autoWaterLastDate";
    const WATER_VER = "autoWaterDataVersion";
    const WATER_VER_NOW = "2";

    const todayStr = () => new Date().toDateString();
    const getConfig = (k, d) => {
        const v = Stg.get(k);
        return v === undefined || v === null || v === "" ? d : v;
    };
    const getTid = () => String(getConfig("autoWaterTid", "94")).replace(/\D/g, "") || "94";
    const getFid = () => String(getConfig("autoWaterFid", "2")).replace(/\D/g, "") || "2";
    const getMessage = () => getConfig("autoWaterMessage", "每日一图，水一贴~");
    const getDailyTaskId = () =>
        String(getConfig("autoWaterDailyTaskId", "1")).replace(/\D/g, "") || "1";

    let postInFlight = false;

    // ---------------- 通知任务模块领奖 ----------------
    async function notifyTaskClaim() {
        const at = MExt.autoTask;
        if (!at) return;
        try {
            at.applyTasks && (await at.applyTasks());
        } catch (e) {
            console.error(e);
        }
        try {
            at.checkTasks && (await at.checkTasks());
        } catch (e) {
            console.error(e);
        }
    }

    // 每日任务（默认 id=1）是否已不在“进行中”，即已领取/已完成
    async function dailyTaskClaimed() {
        const at = MExt.autoTask;
        if (!at || !at.listDoingIds) return false;
        const ids = await at.listDoingIds();
        if (ids == null) return false;
        return !ids.includes(getDailyTaskId());
    }

    // ---------------- 发一帖 ----------------
    // force=true 时忽略“今日已水贴”判断（手动触发）。
    async function silentWater(force) {
        if (!isLogin) return { ok: false, reason: "not-login" };
        if (!force && Stg.get(WATER_DAY) === todayStr()) {
            return { ok: false, reason: "done" };
        }
        if (postInFlight) return { ok: false, reason: "busy" };
        const gallery = MExt.waterGallery;
        if (!gallery) return { ok: false, reason: "no-gallery" };

        if (!gallery.listImages().length) return { ok: false, reason: "no-images" };

        postInFlight = true;
        try {
            const img = await gallery.getRandomImage();
            if (!img) return { ok: false, reason: "no-images" };
            const tid = getTid();
            const fid = getFid();
            dlg("水楼发帖：获取帖子参数...");
            const cfg = await discuz.fetchPostConfig(tid, fid);
            if (!cfg.formhash) return { ok: false, reason: "no-formhash" };
            dlg("水楼发帖：正在上传随机图片...");
            const aid = await gallery.uploadImage(gallery.toFile(img), cfg);
            const message = getMessage() + "\n[attachimg]" + aid + "[/attachimg]";
            const r = await discuz.replyPost({
                tid,
                fid,
                message,
                aids: [aid],
                cfg,
            });
            if (r.ok) {
                Stg.set(WATER_DAY, todayStr());
                dlg("水楼发帖成功，aid=" + aid);
                await notifyTaskClaim();
                return { ok: true, aid };
            }
            dlg("水楼发帖失败：" + String(r.text).replace(/\s+/g, " ").slice(0, 150));
            return { ok: false, reason: "post-failed", body: String(r.text).slice(0, 500) };
        } catch (e) {
            console.error(e);
            dlg("水楼发帖异常：" + e);
            return { ok: false, reason: "error", error: String(e) };
        } finally {
            postInFlight = false;
        }
    }

    // ---------------- 一键完成每日任务 ----------------
    const daily = { running: false, left: 0, done: 0, timer: null, taskWasDoing: false };

    function stopDaily(reason) {
        daily.running = false;
        if (daily.timer) {
            clearTimeout(daily.timer);
            daily.timer = null;
        }
        refreshUI();
        if (reason) dlg("一键完成每日任务：" + reason);
    }

    async function dailyStep() {
        if (!daily.running) return;
        if (daily.left <= 0) {
            stopDaily("已连发 3 帖");
            return;
        }
        daily.left--;
        let r = null;
        try {
            r = await silentWater(true);
        } catch (e) {
            console.error(e);
        }
        if (r && r.ok) daily.done++;
        refreshUI();
        await notifyTaskClaim();
        if (daily.taskWasDoing && (await dailyTaskClaimed())) {
            stopDaily("每日任务已完成");
            return;
        }
        if (daily.left <= 0) {
            stopDaily("已连发 3 帖");
            return;
        }
        refreshUI();
        daily.timer = setTimeout(dailyStep, 15000);
    }

    async function oneClickDaily() {
        if (daily.running) {
            stopDaily("用户终止");
            return;
        }
        daily.running = true;
        daily.left = 3;
        daily.done = 0;
        daily.taskWasDoing = !(await dailyTaskClaimed());
        refreshUI();
        dlg("一键完成每日任务：开始，最多连发 3 帖，每帖间隔 15 秒；再次点击可终止");
        dailyStep();
    }

    // ---------------- UI ----------------
    function saveMessage() {
        const ta = document.querySelector("#waterPostMsg");
        if (!ta) return;
        Stg.set("autoWaterMessage", ta.value);
        dlg("水贴正文已保存");
        refreshUI();
    }
    function refreshUI() {
        const st = document.querySelector("#waterPostStatus");
        if (st) {
            const gallery = MExt.waterGallery;
            const n = gallery ? gallery.listImages().length : 0;
            let run = "未运行";
            if (daily.running) {
                run = "运行中（剩余 " + daily.left + " 帖，已成功 " + daily.done + "）";
            }
            st.innerHTML =
                "今日水贴：<b>" +
                (Stg.get(WATER_DAY) || "从未") +
                "</b>　图库：<b>" +
                n +
                "</b> 张<br>一键任务：" +
                run;
        }
        const btn = document.querySelector("#waterPostDailyBtn");
        if (btn) btn.textContent = daily.running ? "终止一键任务" : "一键完成每日任务";
    }

    function openPoster() {
        const html =
            '<div>' +
            '<h3 class="flb"><em>水楼发帖</em><span><a href="javascript:;" class="flbc" onclick="hideWindow(\'water-post\')" title="关闭">关闭</a></span></h3>' +
            '<p class="waterTip" id="waterPostStatus"></p>' +
            '<p><textarea id="waterPostMsg" class="waterMsg" rows="4"></textarea></p>' +
            '<p class="waterBar">' +
            '<button class="waterBtn" onclick="MExt.waterPost.saveMessage()">保存正文</button>' +
            '<button class="waterBtn" onclick="MExt.waterPost.postOnce()">发一帖（带随机图）</button>' +
            '<button class="waterBtn" id="waterPostDailyBtn" onclick="MExt.waterPost.oneClickDaily()">一键完成每日任务</button>' +
            '<button class="waterBtn" onclick="MExt.waterPost.notifyTaskClaim()">领取任务奖励</button>' +
            "</p>" +
            '<p class="waterTip">“一键完成每日任务”会连发 3 帖、每帖间隔 15 秒；再次点击按钮或每日任务完成后自动终止。发帖可在“水楼图库”中管理图片。</p>' +
            "</div>";
        if (typeof unsafeWindow.showWindow !== "function") {
            alert("当前页面无法打开发帖窗口");
            return;
        }
        unsafeWindow.showWindow("water-post", html, "html");
        setTimeout(() => {
            const ta = document.querySelector("#waterPostMsg");
            if (ta) ta.value = getMessage();
            refreshUI();
        }, 60);
    }

    // ---------------- 模块定义 ----------------
    const waterPost = {
        runcase: () => isLogin && Stg.get("waterPost") !== false,
        config: [
            {
                id: "waterPost",
                default: true,
                type: "check",
                name: "水楼发帖",
                desc: "手动向水楼发帖（带本机随机图），并支持一键完成每日任务；不会自动触发。",
            },
            {
                id: "autoWaterTid",
                default: "94",
                type: "text",
                name: "水楼帖子 ID",
                desc: "发帖的目标帖子 tid，默认为 94。",
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
                name: "水贴正文",
                desc: "每次发帖的正文，脚本会在末尾自动附加随机图片的 [attachimg] 标签；也可在水楼发帖窗口内直接修改并保存。",
            },
            {
                id: "autoWaterDailyTaskId",
                default: "1",
                type: "text",
                name: "每日任务 ID",
                desc: "一键完成每日任务时用于判断任务是否已完成/已领奖的任务 id，默认为 1。",
            },
        ],
        style: /* css */ ".waterBar { margin: 8px 0; }\n" +
            ".waterBtn { margin: 0 5px 5px 0; }\n" +
            ".waterTip { color: #666; font-size: 12px; margin: 4px 0 8px; }\n" +
            ".waterMsg { width: 96%; min-height: 70px; box-sizing: border-box; }\n",
        core: ($) => {
            dlg("水楼发帖已加载");
            if (!isLogin) {
                dlg("未登录，已禁用水楼发帖");
                return;
            }
            // 数据版本迁移（v1→v2：不再自动触发）
            if (Stg.get(WATER_VER) !== WATER_VER_NOW) {
                Stg.set(WATER_VER, WATER_VER_NOW);
            }

            MExt.waterPost = {
                silentWater,
                postOnce: () => silentWater(true),
                oneClickDaily,
                stopDaily,
                openPoster,
                refreshUI,
                saveMessage,
                notifyTaskClaim,
                getState: () => ({ ...daily }),
                dailyTaskClaimed,
            };

            const addMenu = () => {
                const menu = document.querySelector("#userpanel .user_info_menu_btn");
                if (!menu || document.querySelector("#MExt_water_post")) return;
                const li = document.createElement("li");
                li.innerHTML =
                    '<a href="javascript:void(0);" id="MExt_water_post">水楼发帖</a>';
                li.querySelector("a").onclick = openPoster;
                menu.appendChild(li);
            };
            addMenu();
            try {
                observe("#userpanel", addMenu);
            } catch (e) {}
        },
    };
    MExt.exportModule(waterPost);
})();
