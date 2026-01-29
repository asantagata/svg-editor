import context from "./context.js";
import { resizeSVGToFit } from "./d.js";

export const defaultPathD = {
    'Path': () => [{type: 'M', args: [10, 10], id: 0}, {type: 'L', args: [14, 14], id: 1}],
    'Circle': () => [{type:'M',args:[12,1], id: 0},{type:'A',args:[11,11,0,1,0,12,23], id: 1},{type:'A',args:[11,11,0,1,0,12,1], id: 2},{type:'Z',args:[], id: 3}],
    'Rectangle': () => [{type:'M',args:[1,1], id: 0},{type:'L',args:[23,1], id: 1},{type:'L',args:[23,23], id: 2},{type:'L',args:[1,23], id: 3},{type:'Z',args:[], id: 4}],
    'Polygon': () => [{type: 'M', args: [5.53436, 20.89919], id: 0}, {type: 'L', args: [18.46564, 20.89919], id: 1}, {type: 'L', args: [22.461625278697305, 8.600811892343172], id: 2}, {type: 'L', args: [12, 1], id: 3}, {type: 'L', args: [1.5383747213026862, 8.60081189234317], id: 4}, {type: 'Z', args: [], id: 5}],
    'Bone': () => [{type:'M',args:[17,10], id: 0},{type:'C',args:[17.7,9.3,18.69,10,19.5,10], id: 1},{type:'A',args:[2.5,2.5,0,1,0,19.5,5], id: 2},{type:'A',args:[0.5,0.5,0,0,1,19,4.5], id: 3},{type:'A',args:[2.5,2.5,0,1,0,14,4.5], id: 4},{type:'C',args:[14,5.31,14.7,6.3,14,7], id: 5},{type:'L',args:[7,14], id: 6},{type:'C',args:[6.3,14.7,5.31,14,4.5,14], id: 7},{type:'A',args:[2.5,2.5,0,0,0,4.5,19], id: 8},{type:'C',args:[4.78,19,5,19.22,5,19.5], id: 9},{type:'A',args:[2.5,2.5,0,1,0,10,19.5], id: 10},{type:'C',args:[10,18.69,9.3,17.7,10,17], id: 11},{type:'Z',args:[], id: 12}]
};

export function getPathName(type = 'Path') {
    type = type[0].toUpperCase() + type.slice(1).toLowerCase();
    for (let i = 0; i < context.icon.children.length + 1; i++) {
        const attemptedName = i ? `${type} ${i + 1}` : type;
        if (!context.icon.children.find(p => p['data-name'] === attemptedName)) {
            return attemptedName;
        }
    }
}

export function addPath(type = 'Path', cloneFrom = null) {
    const name = getPathName(type);
    const newPath = cloneFrom ? window.structuredClone(cloneFrom) : {...context.defaultPath, tag: 'path', 'data-type': type.toLowerCase(), 'd': defaultPathD[type]()};
    newPath['data-name'] = name;
    context.icon.children.push(newPath);
    selectPath(newPath);
}

export function selectPath(p) {
    if (context.selectedPath === p) return;
    context.selectedPath = p;
    context.selectedPathCommandIds = Array.from({length: p})
    context.commit();
}

export function addImportedSVGPaths(svg) {
    resizeSVGToFit(svg, context.icon.width, context.icon.height);
    svg.children.forEach(p => {
        const newPath = {...p, 'data-name': getPathName(p['data-type'])};
        context.icon.children.push(newPath);
    });
    context.commit();
}