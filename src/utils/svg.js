import context from "./context.js";
import { stringify } from "./d.js";

export function getIconSVG() {
    return {
        ...context.icon,
        viewBox: `0 0 ${context.icon.width} ${context.icon.height}`,
        children: context.icon.children.map(path => ({...path, xmlns: 'http://www.w3.org/2000/svg', d: stringify(path.d)}))
    };
}