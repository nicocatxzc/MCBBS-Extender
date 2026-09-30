import indexedDB from "./utils/db";
import discuz from "./utils/discuz";
import getEditorRows from "./utils/getEditorRows";
import observe from "./utils/observe";

(() => {
    const MExt = unsafeWindow.MExt;
    MExt.Units = {
        ...MExt.Units,
        indexedDB,
        discuz,
        observe,
        getEditorRows,
    };
})();
