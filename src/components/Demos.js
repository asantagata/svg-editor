import context from "../utils/context.js";

const sizes = [2, 1.5, 1];

export default function Demos() {
    return {
        id: 'demos',
        children: sizes.flatMap(size => {
            const side = `calc(${size} * var(--s-lg) + 2 * var(--s-md))`;
            const borderRadius = `var(--s-md)`;
            return [
                {class: 'demo', style: {width: side, height: side, 'border-radius': borderRadius}, children: context.iconSVG},
                {class: 'demo filled', style: {width: side, height: side, 'border-radius': borderRadius}, children: context.iconSVG},
            ];
        })
    };
}