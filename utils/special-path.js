export function getCircleCenter(path) {
    return {x: path.d[0].args[0], y: (path.d[0].args[1] + path.d[1].args[6]) / 2}
}

export function getCircleRight(path) {
    return {x: path.d[0].args[0] + (path.d[1].args[6] - path.d[0].args[1]) / 2, y: (path.d[0].args[1] + path.d[1].args[6]) / 2}
}

export function setCircleCenter(path, point) {
    const radius = (path.d[1].args[6] - path.d[0].args[1]) / 2;
    path.d[0].args = [point.x, point.y - radius];
    path.d[1].args[5] = point.x;
    path.d[1].args[6] = point.y + radius;
    path.d[2].args[5] = point.x;
    path.d[2].args[6] = point.y - radius;
}

export function setCircleRight(path, x) {
    const center = getCircleCenter(path).y;
    const radius = Math.abs(x - center);
    path.d[0].args[1] = center - radius;
    path.d[1].args[0] = radius, path.d[1].args[1] = radius;
    path.d[1].args[6] = center + radius;
    path.d[2].args[0] = radius, path.d[2].args[1] = radius;
    path.d[2].args[6] = center - radius;
}