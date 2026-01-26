import context from "../utils/context.js";

const sizes = [32, 24, 16];

export default function Demos() {
    return {
        id: 'demos',
        children: sizes.flatMap(size => [
            {class: 'demo', style: {width: `${size}px`, height: `${size}px`, 'border-radius': `${size / 64}rem`}, children: context.iconSVG},
            {class: 'demo filled', style: {width: `${size}px`, height: `${size}px`, 'border-radius': `${size / 64}rem`}, children: context.iconSVG},
        ])
    };
}