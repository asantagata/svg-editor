import { getIconSVG } from "./svg.js";
import { defaultPathD } from "./path.js";
import { getID, putSVGInDB } from "./persistence.js";

const defaultPath = {
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'fill': 'none',
    'stroke-width': 2,
};

const context = {
    defaultPath: defaultPath,
    icon: {
        tag: 'svg', xmlns: "http://www.w3.org/2000/svg",
        fill: "none", stroke: "currentColor",
        width: 24, height: 24, 
        children: [
            {...defaultPath, tag: 'path', xmlns: 'http://www.w3.org/2000/svg', 'data-type': 'path', 'data-name': 'Path', d: defaultPathD.Path()}
        ]
    },
    selectedPath: null,
    rerender: () => {},
    commit: () => {
        context.iconSVG = getIconSVG();
        context.rerender();
        queueMicrotask(putSVGInDB);
    },
    iconSVG: {},
    name: 'my-icon',
    id: getID(),
    modal: null,
    saves: null
};

context.iconSVG = getIconSVG(context.icon);

export default context;