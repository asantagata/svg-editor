const radius = 0.2;

export default function Point(coords) {
    return {
        tag: 'ellipse', 
        xmlns: 'http://www.w3.org/2000/svg', 
        fill: 'var(--c-accent)', 
        stroke: 'none',
        cx: coords.x, 
        cy: coords.y,
        rx: radius,
        ry: radius
    };
}