import context from "./context.js";
import { stringify } from "./d.js";

export function getIconSVG(icon = context.icon) {
    return {
        ...icon,
        viewBox: `0 0 ${icon.width} ${icon.height}`,
        children: icon.children.map(path => ({...path, xmlns: 'http://www.w3.org/2000/svg', d: stringify(path.d)}))
    };
}