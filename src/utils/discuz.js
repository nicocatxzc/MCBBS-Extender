// Discuz 通用工具：帖子参数解析、附件上传、回复发帖
// 供各功能模块复用，本身不注册任何模块或界面。
const log = (m) => unsafeWindow.MExt?.debugLog?.(m);

// 解析帖子页内的发帖/上传参数
export function parseUploadConfig(html, fallback = {}) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const form = doc.querySelector("#fastpostform");
    const action = form ? form.getAttribute("action") || "" : "";
    const fidM = /fid=(\d+)/.exec(action);
    const tidM = /tid=(\d+)/.exec(action);
    const uploadUrlM = /"?upload_url"?\s*:\s*"([^"]+)"/.exec(html);
    const paramsM = /"?post_params"?\s*:\s*\{([^}]*)\}/.exec(html);
    let uid = "";
    let hash = "";
    if (paramsM) {
        uid = (/"uid"\s*:\s*"([^"]*)"/.exec(paramsM[1]) || [])[1] || "";
        hash = (/"hash"\s*:\s*"([^"]*)"/.exec(paramsM[1]) || [])[1] || "";
    }
    const formhashEl = form && form.querySelector('input[name="formhash"]');
    const posttimeEl = form && form.querySelector('input[name="posttime"]');
    const fid = fidM ? fidM[1] : String(fallback.fid || "");
    const tid = tidM ? tidM[1] : String(fallback.tid || "");
    return {
        uploadUrl: uploadUrlM
            ? uploadUrlM[1]
            : "/misc.php?mod=swfupload&action=swfupload&operation=upload&fid=" + fid,
        uid,
        hash,
        fid,
        tid,
        formhash: formhashEl ? formhashEl.value : "",
        posttime: posttimeEl
            ? posttimeEl.value
            : String(Math.floor(Date.now() / 1000)),
        action:
            action ||
            "forum.php?mod=post&action=reply&fid=" +
                fid +
                "&tid=" +
                tid +
                "&replysubmit=yes&infloat=yes&handlekey=fastpost",
    };
}

// 拉取帖子页并解析发帖参数
export async function fetchPostConfig(tid, fid) {
    const res = await fetch("forum.php?mod=viewthread&tid=" + tid, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("打开帖子失败 HTTP " + res.status);
    return parseUploadConfig(await res.text(), { tid, fid });
}

// 上传单个附件，返回附件 id（aid）
export async function uploadAttachment(file, cfg) {
    if (!cfg || !cfg.uploadUrl || !cfg.uid || !cfg.hash) {
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
    if (res.status !== 200) {
        throw new Error("附件上传失败 HTTP " + res.status + "：" + text.slice(0, 120));
    }
    const aid = parseInt(text, 10);
    if (!aid || aid <= 0) {
        throw new Error("附件上传失败：" + text.slice(0, 200));
    }
    return aid;
}

// 回帖。message 为正文；aids 为已经上传好的附件 id 数组（本函数不负责上传）
export async function replyPost({ tid, fid, message, aids = [], cfg }) {
    cfg = cfg || (await fetchPostConfig(tid, fid));
    if (!cfg.formhash) throw new Error("无法获取 formhash，可能未登录");
    const fd = new FormData();
    fd.append("formhash", cfg.formhash);
    fd.append("posttime", cfg.posttime);
    fd.append("subject", "  ");
    fd.append("usesig", "1");
    fd.append("message", message);
    fd.append("replysubmit", "yes");
    fd.append("infloat", "yes");
    fd.append("handlekey", "fastpost");
    // Discuz 只有带 inajax 标记时才走 AJAX 分支并返回 succeedhandle_fastpost
    fd.append("inajax", "1");
    aids.forEach((aid) => {
        fd.append("attachnew[" + aid + "][description]", "");
        fd.append("attachnew[" + aid + "][readperm]", "");
    });
    const res = await fetch(cfg.action, {
        method: "POST",
        body: fd,
        credentials: "include",
    });
    const text = await res.text();
    const ok = /succeedhandle_fastpost/.test(text);
    log("回帖返回 ok=" + ok);
    return { ok, text, aid: aids[0] };
}

// 图库对象转 File
export function toFile(img) {
    const type = img.meta.type || "image/jpeg";
    const name = img.meta.name || "water.jpg";
    return new File([img.buffer], name, { type });
}

export default {
    parseUploadConfig,
    fetchPostConfig,
    uploadAttachment,
    replyPost,
    toFile,
};
