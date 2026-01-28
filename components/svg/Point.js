const radius = 0.3;
const strokeWidth = 0.15;
const plusWidth = 0.075;
const color = 'var(--c-accent)';
const lightColor = '#EACCD6';

export default function Point(coords, type) {
    return {
        tag: 'g', 
        xmlns: 'http://www.w3.org/2000/svg', 
        dataset: { pointType: type },
        children: [
            {
                tag: 'ellipse',
                xmlns: 'http://www.w3.org/2000/svg', 
                fill: type === 'outline' || type === 'line' ? lightColor : color,
                stroke: type === 'line' ? lightColor : color,
                'stroke-width': strokeWidth,
                cx: coords.x, 
                cy: coords.y,
                rx: radius - strokeWidth,
                ry: radius - strokeWidth
            },
            ...(type === 'plus' ? [{
                tag: 'path',
                xmlns: 'http://www.w3.org/2000/svg',
                stroke: lightColor,
                'stroke-width': plusWidth,
                'stroke-linecap': 'round',
                d: `M${coords.x - strokeWidth} ${coords.y}L${coords.x + strokeWidth} ${coords.y}
                M${coords.x} ${coords.y - strokeWidth}L${coords.x } ${coords.y + strokeWidth}`
            }] : [])
        ]
    };
}