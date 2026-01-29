export function getCircleCenter(path) {
    return {x: path.d[0].args[0], y: (path.d[0].args[1] + path.d[1].args[6]) / 2}
}

export function getCircleRight(path) {
    return {x: path.d[0].args[0] + (path.d[1].args[6] - path.d[0].args[1]) / 2, y: (path.d[0].args[1] + path.d[1].args[6]) / 2}
}

export function getCircleRadius(path) {
    return (path.d[1].args[6] - path.d[0].args[1]) / 2
}

export function setCircleCenter(path, point) {
    const radius = getCircleRadius(path);
    path.d[0].args = [point.x, point.y - radius];
    path.d[1].args[5] = point.x;
    path.d[1].args[6] = point.y + radius;
    path.d[2].args[5] = point.x;
    path.d[2].args[6] = point.y - radius;
}

export function setCircleRight(path, x) {
    const center = getCircleCenter(path).y;
    const radius = Math.abs(x - center);
    setCircleRadius(path, radius);
}

export function setCircleRadius(path, radius) {
    const center = getCircleCenter(path).y;
    path.d[0].args[1] = center - radius;
    path.d[1].args[0] = radius, path.d[1].args[1] = radius;
    path.d[1].args[6] = center + radius;
    path.d[2].args[0] = radius, path.d[2].args[1] = radius;
    path.d[2].args[6] = center - radius;
}

export function getPolygonSidecount(path) {
    return path.d.length - 1;
}

function bisector(P, Q) {
    const mx = (P.args[0] + Q.args[0]) / 2;
    const my = (P.args[1] + Q.args[1]) / 2;
    const dx = Q.args[0] - P.args[0];
    const dy = Q.args[1] - P.args[1];
    return { mx, my, dx, dy };
}

export function getPolygonCenter(path) {
    if (path.d.every(c => c.args.length === 0 || c.args[0] === path.d[0].args[0] && c.args[1] === path.d[0].args[1])) 
        return {x: path.d[0].args[0], y: path.d[0].args[1]};
    const A = path.d[0];
    const B = path.d[1];
    const C = path.d[2];

    const b1 = bisector(A, B);
    const b2 = bisector(B, C);

    const A1 = b1.dx, B1 = b1.dy, C1 = A1 * b1.mx + B1 * b1.my;
    const A2 = b2.dx, B2 = b2.dy, C2 = A2 * b2.mx + B2 * b2.my;

    const det = A1 * B2 - A2 * B1;

    return {
        x: (C1 * B2 - C2 * B1) / det,
        y: (A1 * C2 - A2 * C1) / det
    };
}


export function getPolygonBottom(path) {
    return {
        x: (path.d[0].args[0] + path.d[1].args[0]) / 2,
        y: path.d[0].args[1],
    };
}

export function getPolygonCornerRadius(path) {
    const center = getPolygonCenter(path);
    return Math.hypot(center.x - path.d[0].args[0], center.y - path.d[0].args[1]);
}

function getPolygonPoints(center, nPoints, cornerRadius) {
    if (cornerRadius === 0) return Array.from({length: nPoints}, () => ({...center}));
    const angle = (nPoints % 2 === 1 ? Math.PI / 2 : (nPoints % 4 === 0 ? 1 : 2) * Math.PI / nPoints) + Math.PI;
    const rotx = Math.cos(angle), roty = Math.sin(angle);
    return Array.from({length: nPoints}, (_, i) => {
        const value = 2 * Math.PI * (nPoints % 2 === 1 ? -i - Math.floor(nPoints / 2) : (nPoints % 4 === 0 ? 0 : -1) - i - Math.floor(nPoints / 4)) / nPoints;
        const sin = Math.sin(value), cos = Math.cos(value);
        return {
            x: center.x + (rotx * cos - roty * sin) * cornerRadius, 
            y: center.y + (rotx * sin + roty * cos) * cornerRadius
        };
    });
}

export function setPolygonCenter(path, center) {
    const nPoints = getPolygonSidecount(path);
    const cornerRadius = getPolygonCornerRadius(path);
    const points = getPolygonPoints(center, nPoints, cornerRadius);
    for (let i = 0; i < nPoints; i++) {
        path.d[i].args = [points[i].x, points[i].y];
    }
}

function sideRadiusToCornerRadius(sideRadius, nPoints) {
    return sideRadius / Math.cos(Math.PI / nPoints);
}

export function getPolygonSideRadius(path) {
    const nPoints = getPolygonSidecount(path);
    return getPolygonCornerRadius(path) * Math.cos(Math.PI / nPoints);
}

export function setPolygonSideRadius(path, sideRadius) {
    const nPoints = getPolygonSidecount(path);
    const cornerRadius = sideRadiusToCornerRadius(sideRadius, nPoints);
    const center = getPolygonCenter(path);
    const points = getPolygonPoints(center, nPoints, cornerRadius);
    for (let i = 0; i < nPoints; i++) {
        path.d[i].args = [points[i].x, points[i].y];
    }
}

export function setPolygonSidecount(path, newNPoints) {
    const oldNPoints = getPolygonSidecount(path);
    const cornerRadius = getPolygonCornerRadius(path);
    const center = getPolygonCenter(path);
    if (oldNPoints > newNPoints) {
        path.d.splice(1, oldNPoints - newNPoints);
    } else if (oldNPoints < newNPoints) {
        const id = Math.max(...path.d.map(cmd => cmd.id)) + 1;
        path.d.splice(1, 0, ...Array.from({length: newNPoints - oldNPoints}, (_, i) => ({
            type: 'L',
            args: [0, 0],
            id: id + i
        })));
    }
    const points = getPolygonPoints(center, newNPoints, cornerRadius);
    for (let i = 0; i < newNPoints; i++) {
        path.d[i].args = [points[i].x, points[i].y];
    }
}