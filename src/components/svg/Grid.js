const gridlineWidth = '0.1';
const gridlineColor = 'var(--c-border)';

export default function Grid(width, height) {
    return [
        ...Array.from({length: height + 1}, (_, i) => ({tag: 'path', key: `row-${i}`, 'stroke-width': gridlineWidth, stroke: gridlineColor, xmlns: 'http://www.w3.org/2000/svg', d: `M0 ${i}H${width}`})),
        ...Array.from({length: width + 1}, (_, i) => ({tag: 'path', key: `col-${i}`, 'stroke-width': gridlineWidth, stroke: gridlineColor, xmlns: 'http://www.w3.org/2000/svg', d: `M${i} 0V${height}`}))
    ];
}