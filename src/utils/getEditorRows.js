// 编辑器小按钮行列
const getEditorRows = (() => {
    function ensureId(el, index) {
        if (!el.id) {
            el.id = "e_adv_s3_row_" + index;
        }
    }

    function resolve() {
        const container = document.querySelector("#e_adv_s3");
        if (!container) return null;

        const rows = Array.from(container.querySelectorAll(":scope > p"));

        // 从后往前找最后一个 a 数量 < 2 的
        for (let i = rows.length - 1; i >= 0; i--) {
            const aCount = rows[i].querySelectorAll(":scope > a").length;
            if (aCount < 2) {
                ensureId(rows[i], i);
                return {
                    element: rows[i],
                    selector: "#" + rows[i].id,
                };
            }
        }

        // 没有可用列，创建新列
        const newRow = document.createElement("p");
        container.appendChild(newRow);
        ensureId(newRow, rows.length);

        return {
            element: newRow,
            selector: "#" + newRow.id,
        };
    }

    return resolve;
})();
export default getEditorRows;
