const radius = 0.3;
const strokeWidth = 0.15;
const color = 'var(--c-accent)';

export default function Point(coords, type) {
    return {
        tag: 'ellipse', 
        xmlns: 'http://www.w3.org/2000/svg', 
        fill: type === 'full' ? color : '#EACCD6', 
        stroke: color,
        'stroke-width': strokeWidth,
        cx: coords.x, 
        cy: coords.y,
        rx: radius - strokeWidth,
        ry: radius - strokeWidth
    };
}