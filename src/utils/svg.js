import context from "./context.js";
import { stringify } from "./d.js";

export function getIconSVG(ctx = context) {
    return {
        ...ctx.icon,
        viewBox: `0 0 ${ctx.icon.width} ${ctx.icon.height}`,
        children: ctx.icon.children.map(path => ({...path, xmlns: 'http://www.w3.org/2000/svg', d: stringify(path.d)}))
    };
}