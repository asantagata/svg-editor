import { commandify, tokenize, fixCommands } from "./d.js";
import context from "./context.js";
import { getIconSVG } from "./svg.js";

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
                SVGStringtoFRUIT(target.result, resolve, reject);
            }
            reader.onerror = function() {
                reject('Unable to read file.');
            }
        });
        input.click();
    });
}

export function pasteSVG() {
    return new Promise((resolve, reject) => {
        navigator.clipboard.readText().then(text => {
            SVGStringtoFRUIT(text, resolve, reject);
        });
    });
}

function identifyNearestProperty(shape, property) {
    do {
        const value = getStylableProperty(shape, property);
        if (value !== null) {
            return value;
        }
        shape = shape.parentElement;
    } while (shape);
}

function svgWidthAndHeight(svg) {
    if (getStylableProperty(svg, 'width') && getStylableProperty(svg, 'height')) {
        return {width: parseFloat(getStylableProperty(svg, 'width')), height: parseFloat(getStylableProperty(svg, 'height'))}
    } else if (getStylableProperty(svg, 'viewBox')) {
        const entries = getStylableProperty(svg, 'viewBox').split(/(,| +|, +)/).map(parseFloat);
        return {width: entries[2], height: entries[3]};
    } else if (getStylableProperty(svg, 'width')) {
        return {width: parseFloat(getStylableProperty(svg, 'width')), height: parseFloat(getStylableProperty(svg, 'width'))}
    } else if (getStylableProperty(svg, 'height')) {
        return {width: parseFloat(getStylableProperty(svg, 'height')), height: parseFloat(getStylableProperty(svg, 'height'))}
    } else {
        return {width: 24, height: 24};
    }
}

function SVGStringtoFRUIT(svg, resolve, reject) {
    try {
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
        const result = {...icon, children: paths};
        if (/transform|<defs|\Wrx\W|\Wry\W/.test(svg)) {
            context.modal = 'warning';
            context.warning = {
                body: [
                    {children: `The SVG was found to have unsupported features and may not have been imported successfully. Do you wish to import this SVG?`},
                    {class: 'svg-wrapper', children: getIconSVG(result)}
                ],
                button: {
                    text: 'OK',
                    onClick: () => resolve(result)
                },
                leftButton: {
                    text: 'Cancel',
                    onClick: () => reject(null)
                }
            };
            context.rerender();
        } else {
            resolve(result);
        }
    } catch (e) {
        context.modal = 'warning';
        context.warning = {
            body: `The SVG could not be processed. Try uploading it as a .svg file.`,
            button: {
                text: 'OK',
                onClick: () => reject(null)
            }
        };
        context.rerender();
    }
}

function getStylableProperty(shape, property, placeholder = null) {
    if (shape.style?.getPropertyValue(property)) return shape.style.getPropertyValue(property);
    if (shape.hasAttribute(property)) return shape.getAttribute(property);
    else return placeholder;
}

function getStylableNumericProperty(shape, property, placeholder = null) {
    if (shape.style?.getPropertyValue(property)) {
        const value = parseFloat(shape.style.getPropertyValue(property));
        if (Number.isNaN(value)) return placeholder;
        return value;
    } if (shape.hasAttribute(property)) {
        const value = parseFloat(shape.getAttribute(property));
        if (Number.isNaN(value)) return placeholder;
        return value;
    } else return placeholder;
}

function getArgs(obj, shape) {
    return Object.fromEntries(Object.keys(obj).map(key => 
        [key, getStylableNumericProperty(shape, key, obj[key])]
    ));
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
            if (shape.tagName.toLowerCase() === 'polyline') return commands;
            return [...commands, {type: 'Z', args: []}];
        }
    }
}