const gridlineWidth = '0.1';
const gridlineColor = 'var(--c-border)';
const selectedGridlineColor = 'var(--c-light-border)';

export default function Grid(width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const bgRows = Array.from({length: height + 1}, (_, i) => i).filter(i => Math.abs(halfHeight - i) >= 1);
    const frontRows = Array.from({length: height + 1}, (_, i) => i).filter(i => Math.abs(halfHeight - i) < 1);
    const bgCols = Array.from({length: width + 1}, (_, i) => i).filter(i => Math.abs(halfWidth - i) >= 1);
    const frontCols = Array.from({length: width + 1}, (_, i) => i).filter(i => Math.abs(halfWidth - i) < 1);
    return [
        ...bgRows.map(i => ({tag: 'path', 'data-gridline': 'true', key: `row-${i}`, 'stroke-width': gridlineWidth, stroke: (Math.abs(halfHeight - i) >= 1) ? gridlineColor : selectedGridlineColor, xmlns: 'http://www.w3.org/2000/svg', d: `M0 ${i}H${width}`})),
        ...bgCols.map(i => ({tag: 'path', 'data-gridline': 'true', key: `col-${i}`, 'stroke-width': gridlineWidth, stroke: (Math.abs(halfWidth - i) >= 1) ? gridlineColor : selectedGridlineColor, xmlns: 'http://www.w3.org/2000/svg', d: `M${i} 0V${height}`})),
        ...frontRows.map(i => ({tag: 'path', 'data-gridline': 'true', key: `row-${i}`, 'stroke-width': gridlineWidth, stroke: (Math.abs(halfHeight - i) >= 1) ? gridlineColor : selectedGridlineColor, xmlns: 'http://www.w3.org/2000/svg', d: `M0 ${i}H${width}`})),
        ...frontCols.map(i => ({tag: 'path', 'data-gridline': 'true', key: `col-${i}`, 'stroke-width': gridlineWidth, stroke: (Math.abs(halfWidth - i) >= 1) ? gridlineColor : selectedGridlineColor, xmlns: 'http://www.w3.org/2000/svg', d: `M${i} 0V${height}`})),
    ];
}