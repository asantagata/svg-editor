import context from "./context.js";
import { stringify } from "./d.js";

export function getIconSVG() {
    return {
        ...context.icon,
        children: context.icon.children.map(path => ({...path, xmlns: 'http://www.w3.org/2000/svg', d: stringify(path.d)}))
    };
}