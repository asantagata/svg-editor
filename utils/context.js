import { getIconSVG } from "./svg.js";
import { defaultPathD } from "./path.js";
import { getID, putSVGInDB } from "./persistence.js";

export function getDefaultPath() { 
    return {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'fill': 'none',
        'stroke-width': 2,
    };
}

export function getDefaultIcon() { 
    return {
        tag: 'svg', xmlns: "http://www.w3.org/2000/svg",
        fill: "none", stroke: "currentColor",
        width: 24, height: 24
    };
}

const context = {
    defaultPath: getDefaultPath(),
    icon: {
        ...getDefaultIcon(), 
        children: [
            {...getDefaultPath(), tag: 'path', xmlns: 'http://www.w3.org/2000/svg', 'data-type': 'path', 'data-name': 'Path', d: defaultPathD.Path()}
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
    saves: null,
    warning: null
};

context.iconSVG = getIconSVG(context.icon);

export default context;