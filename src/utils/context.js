import { getIconSVG } from "./svg.js";

const context = {
    defaultPath: {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'fill': 'none',
        'stroke-width': 1,
    },
    icon: {
        tag: 'svg', xmlns: "http://www.w3.org/2000/svg",
        fill: "none", stroke: "currentColor",
        width: 24, height: 24, 'viewBox': '0 0 24 24', // always preserve viewbox='0 0 w h' % w,h are pos ints
        children: []
    },
    selectedPath: null,
    rerender: () => {},
    commit: () => {
        context.iconSVG = getIconSVG();
        context.rerender();
    },
    iconSVG: {tag: 'svg', xmlns: "http://www.w3.org/2000/svg", children: []}
};

export default context;