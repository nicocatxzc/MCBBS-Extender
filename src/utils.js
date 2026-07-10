import indexedDB from "./utils/db";
import getEditorRows from "./utils/getEditorRows";
import observe from "./utils/observe";

(() => {
    const MExt = unsafeWindow.MExt;
    MExt.Units = {
        ...MExt.Units,
        indexedDB,
        observe,
        getEditorRows,
    };
})();
