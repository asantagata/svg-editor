import { commandify, tokenize, fixCommands } from "./d.js";

export function uploadSVG() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.svg';
        input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = function({ target }) {
                resolve(SVGStringtoFRUIT(target.result));
            }
            reader.onerror = function() {
                reject('Unable to read file.');
            }
        });
        input.click();
    });
}

function identifyNearestProperty(shape, property) {
    do {
        if (shape.getAttribute(property)) {
            return shape.getAttribute(property);
        }
        shape = shape.parentElement;
    } while (shape);
}

function svgWidthAndHeight(svg) {
    if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
        return {width: parseFloat(svg.getAttribute('width')), height: parseFloat(svg.getAttribute('height'))}
    } else if (svg.hasAttribute('viewBox')) {
        const entries = svg.getAttribute('viewBox').split(/(,| +|, +)/).map(parseFloat);
        return {width: entries[2], height: entries[3]};
    } else if (svg.hasAttribute('width')) {
        return {width: parseFloat(svg.getAttribute('width')), height: parseFloat(svg.getAttribute('width'))}
    } else if (svg.hasAttribute('height')) {
        return {width: parseFloat(svg.getAttribute('height')), height: parseFloat(svg.getAttribute('height'))}
    } else {
        return {width: 24, height: 24};
    }
}

function SVGStringtoFRUIT(svg) {
    const parent = document.createElement('div');
    parent.innerHTML = svg;
    const element = parent.children[0];
    const icon = {
        tag: 'svg', xmlns: "http://www.w3.org/2000/svg",
        fill: "none", stroke: "currentColor",
        ...svgWidthAndHeight(element)
    };
    const paths = Array.from(element.querySelectorAll('circle, ellipse, polygon, polyline, path, rect')).map(shape => ({
        tag: 'path', 
        'data-type': 'path', 
        xmlns: "http://www.w3.org/2000/svg",
        // name tbd
        d: getCommands(shape).map((cmd, id) => ({...cmd, id})),
        'stroke-linejoin': identifyNearestProperty(shape, 'stroke-linejoin') ?? 'round',
        'stroke-linecap': identifyNearestProperty(shape, 'stroke-linecap') ?? 'round',
        'stroke-width': (() => {
            const width = identifyNearestProperty(shape, 'stroke-width');
            if (width && parseFloat(width)) return parseFloat(width);
            return 2;
        })(),
        fill: (() => {
            const fill = identifyNearestProperty(shape, 'fill');
            if (!fill || fill.trim().toLowerCase() === 'none') return 'none';
            return 'currentColor';
        })()
    }));
    return {...icon, children: paths};
}

function getArgs(obj, shape) {
    return Object.fromEntries(Object.keys(obj).map(key => {
        if (shape.hasAttribute(key)) {
            const value = parseFloat(shape.getAttribute(key));
            if (parseFloat.isNaN(value)) return [key, obj[key]];
            return [key, value];
        } else return [key, obj[key]];
    }));
}

function getCommands(shape) {
    switch (shape.tagName.toLowerCase()) {
        case 'path': return fixCommands(commandify(shape.getAttribute('d')));
        case 'rect': {
            const args = getArgs({x: 0, y: 0, width: 0, height: 0}, shape);
            return [
                {type: 'M', args: [args.x, args.y]},
                {type: 'L', args: [args.x, args.y + args.height]},
                {type: 'L', args: [args.x + args.width, args.y + args.height]},
                {type: 'L', args: [args.x + args.width, args.y]},
                {type: 'Z', args: []}
            ];
        };
        case 'circle': {
            const args = getArgs({cx: 0, cy: 0, r: 0}, shape);
            return [
                {type: 'M', args: [args.cx, args.cy - args.r]},
                {type: 'A', args: [args.r, args.r, 0, 1, 0, args.cx, args.cy + args.r]},
                {type: 'A', args: [args.r, args.r, 0, 1, 0, args.cx, args.cy - args.r]},
                {type: 'Z', args: []}
            ];
        };
        case 'ellipse': {
            const args = getArgs({cx: 0, cy: 0, rx: 0, ry: 0}, shape);
            return [
                {type: 'M', args: [args.cx, args.cy - args.ry]},
                {type: 'A', args: [args.rx, args.ry, 0, 1, 0, args.cx, args.cy + args.ry]},
                {type: 'A', args: [args.rx, args.ry, 0, 1, 0, args.cx, args.cy - args.ry]},
                {type: 'Z', args: []}
            ];
        };
        default: {
            const points = tokenize(shape.getAttribute('points') ?? '').map(parseFloat);
            const commands = Array.from({length: Math.round(points.length / 2)}, (_, i) => ({
                type: i === 0 ? 'M' : 'L',
                args: [points[i * 2], points[i * 2 + 1]]
            }));
            console.log(commands[0].args, points);
            if (shape.tagName.toLowerCase() === 'polyline') return commands;
            return [...commands, {type: 'Z', args: []}];
        }
    }
}