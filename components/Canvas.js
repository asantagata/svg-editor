import context from "../utils/context.js";
import { selectPath, addPath } from "../utils/path.js";
import { isolateCoordsFromAbsoluteCmd, insertCommand, setCommandType, translateCommandBy, stringify } from "../utils/d.js";
import { getIconSVG } from "../utils/svg.js";
import Grid from "./svg/Grid.js";
import Point from "./svg/Point.js";
import { selectCommandFromList } from "./CommandList.js";
import { 
    getCircleCenter, getCircleRight, setCircleCenter, setCircleRight,
    getPolygonCenter, getPolygonBottom, getPolygonSideRadius, setPolygonCenter, setPolygonSideRadius
} from "../utils/special-path.js";

const highlightedPathColor = '#D693AA';
const overlayPathColor = '#EACCD6';
const overlayPathWidth = '0.1';
const dashedPath = {
    tag: 'path', 
    xmlns: 'http://www.w3.org/2000/svg', 
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'stroke-width': overlayPathWidth,
    stroke: overlayPathColor + 'C0',
    'stroke-dasharray': '0.2 0.2'
};

function approxEqual(a, b, tol = 1e-3) {
    return Math.abs(a - b) <= tol;
}

function fixRect(rect) {
    if (rect.width > rect.height) {
        // need to adjust xposn
        return new DOMRectReadOnly(
            (rect.left + rect.right - rect.height) / 2,
            rect.top,
            rect.height,
            rect.height
        );
    } else if (rect.width < rect.height) {
        // need to adjust yposn
        return new DOMRectReadOnly(
            rect.left,
            (rect.top + rect.bottom - rect.width) / 2,
            rect.width,
            rect.width
        );
    }
    return rect;
}

function pointMousedownListener(thisArg, commandId, xIndex = null) {
    const command = context.selectedPath.d.find(c => c.id === commandId);
    thisArg.state.selectedPointCommand = command;
    thisArg.state.xIndex = xIndex ?? command.args.length - 2;
    thisArg.state.selectedPointCommandOriginalArgs = [...command.args];
    thisArg.state.svgBindingRect = fixRect(thisArg.element.getBoundingClientRect());
}

function Canvas() {
    return {
        id: 'canvas-wrapper',
        children: [
            {
                key: context.selectedPath ? context.selectedPath['data-name'] : 'none',
                state() {
                    return { 
                        selectedPointCommand: null,
                        xIndex: -1,
                        selectedPointCommandOriginalArgs: [],
                        svgBindingRect: null,
                        plusCommandId: -1,

                        translatingPathName: null,
                        translatingPathStartCoords: null,
                        translatingPathOffsets: null,
                        translatingPathStartD: null,
                        prospectiveTranslatingPathName: null,
                    };
                },
                render() {
                    return {
                        ...context.iconSVG,
                        dataset: {
                            dragging: !!this.state.selectedPointCommand,
                            translating: !!this.state.translatingPathName
                        },
                        children: [
                            // grid
                            ...Grid(context.icon.width, context.icon.height),

                            // main SVG
                            ...getIconSVG().children.map(path => ({
                                ...path, 
                                key: `path-${path['data-name']}`,
                                stroke: context.selectedPath && context.selectedPath['data-name'] === path['data-name']
                                    ? highlightedPathColor : 'currentColor',
                                on: {click() {
                                    if (this.state.translatingPathName !== path['data-name'])
                                        selectPath(context.icon.children
                                            .find(child => child['data-name'] === path['data-name'])) 
                                    },
                                    mousedown() {
                                        this.state.prospectiveTranslatingPathName = path['data-name'];
                                    },
                                    mousemove(e) {
                                        if (this.state.prospectiveTranslatingPathName !== path['data-name']) return;
                                        this.state.translatingPathName = path['data-name'];
                                        this.state.translatingPathStartD = context.icon.children.find(c => c['data-name'] === path['data-name']).d;
                                        this.state.svgBindingRect = fixRect(this.element.getBoundingClientRect());
                                        const xProportion = (e.clientX - this.state.svgBindingRect.left) / this.state.svgBindingRect.width, yProportion = (e.clientY - this.state.svgBindingRect.top) / this.state.svgBindingRect.height;
                                        const xPos = xProportion * context.icon.width, 
                                            yPos = yProportion * context.icon.height;
                                        this.state.translatingPathStartCoords = {x: xPos, y: yPos};
                                        this.state.translatingPathOffsets = {x: 0, y: 0};
                                    }
                                }
                                })
                            ),

                            ...(context.selectedPath ? 
                                ((context.selectedPath['data-type'] === 'path' || context.selectedPath['data-type'] === 'bone') ? [
                                    
                                // underline path
                                {
                                    tag: 'path', 
                                    xmlns: 'http://www.w3.org/2000/svg', 
                                    'stroke-linecap': 'round',
                                    'stroke-linejoin': 'round',
                                    'stroke-width': overlayPathWidth,
                                    stroke: overlayPathColor,
                                    key: 'overlay-selected-path',
                                    d: context.selectedPath.d.map((command, index) => {    
                                        let coords = isolateCoordsFromAbsoluteCmd(command, context.selectedPath.d);
                                        const verb = index ? 'L' : 'M';
                                        return `${verb}${coords.x} ${coords.y}`;
                                    }).join('')
                                },

                                {
                                    ...dashedPath,
                                    key: 'overlay-selected-path-controls',
                                    d: context.selectedPath.d.map((command, index, commands) => {
                                        if (index === 0) return '';
                                        if (command.type === 'C' || command.type === 'Q') {
                                            const prevCommand = commands[index - 1];
                                            let coords = isolateCoordsFromAbsoluteCmd(command, commands);
                                            let prevCoords = isolateCoordsFromAbsoluteCmd(prevCommand, commands);
                                            let prevCoordsPoint = {x: command.args[0], y: command.args[1]};
                                            let coordsPoint = command.type === 'Q' ? prevCoordsPoint
                                                : {x: command.args[2], y: command.args[3]};
                                            return `M${prevCoords.x} ${prevCoords.y}L${prevCoordsPoint.x} ${prevCoordsPoint.y}M${coords.x} ${coords.y}L${coordsPoint.x} ${coordsPoint.y}`;
                                        } else return '';
                                    }).join('')
                                },

                                // + points
                                ...context.selectedPath.d.flatMap((command, index, commands) => {
                                    if (index === 0) return [];
                                    const prevCommand = commands.at(index - 1);
                                    const coords = isolateCoordsFromAbsoluteCmd(command, commands);
                                    const prevCoords = isolateCoordsFromAbsoluteCmd(prevCommand, commands);
                                    const avgCoords = {
                                        x: (coords.x + prevCoords.x) / 2,
                                        y: (coords.y + prevCoords.y) / 2
                                    };
                                    return {
                                        ...Point(avgCoords, 
                                            command.id === this.state.plusCommandId ? 'plus' : 'line'
                                        ), 
                                        key: `line-${command.id}`,
                                        on: {
                                            dblclick() {
                                                if (command.id === this.state.plusCommandId) {
                                                    setCommandType(command, 'L');
                                                    this.state.plusCommandId = -1;
                                                    insertCommand('L', context.selectedPath.d.findIndex(cmd => cmd.id === command.id) - 1);
                                                    context.commit();
                                                }
                                            },
                                            click() {
                                                selectCommandFromList(command);
                                                if (this.state.plusCommandId !== command.id) {
                                                    this.state.plusCommandId = command.id;
                                                    this.rerender();
                                                    window.setTimeout(() => {
                                                        this.state.plusCommandId = -1;
                                                        this.rerender();
                                                    }, 500);
                                                }
                                            },
                                            mouseleave() {
                                                this.state.plusCommandId = -1;
                                                this.rerender();
                                            }
                                        }
                                    };                                    
                                }),

                                // points
                                ...context.selectedPath.d.flatMap((command) => {
                                    if (command.type === 'Z') return [];
                                    const coords = isolateCoordsFromAbsoluteCmd(command, context.selectedPath.d);
                                    const endpoint = {...Point(coords, 'full'), key: `endpoint${command.id}`, on: {
                                        mousedown() {
                                            pointMousedownListener(this, command.id);
                                        }
                                    }};
                                    if (command.type === 'C' || command.type === 'Q') {
                                        const startControl = {...Point({x: command.args[0], y: command.args[1]}, 'outline'), key: `startcontrol${command.id}`, on: {
                                            mousedown() {
                                                pointMousedownListener(this, command.id, 0);
                                            }
                                        }};
                                        if (command.type === 'Q') return [startControl, endpoint];
                                        const endControl = {...Point({x: command.args[2], y: command.args[3]}, 'outline'), key: `endcontrol${command.id}`, on: {
                                            mousedown() {
                                                pointMousedownListener(this, command.id, 2);
                                            }
                                        }};
                                        return [startControl, endControl, endpoint];
                                    } else return endpoint;
                                })
                            ] : context.selectedPath['data-type'] === 'circle' ? (() => {
                                const center = getCircleCenter(context.selectedPath);
                                const right = getCircleRight(context.selectedPath);
                                return [
                                    {...dashedPath, key: 'dashed-circle-line', d: `M${center.x} ${center.y}L${right.x} ${right.y}`},
                                    {...Point(center, 'full'), key: 'circle-center', on: {mousedown() {
                                        this.state.selectedPointCommand = 'circle-center';
                                        this.state.svgBindingRect = fixRect(this.element.getBoundingClientRect());
                                    }}},
                                    {...Point(right, 'outline'), key: 'circle-right', on: {mousedown() {
                                        this.state.selectedPointCommand = 'circle-right';
                                        this.state.svgBindingRect = fixRect(this.element.getBoundingClientRect());
                                    }}}
                                ];
                            })() : context.selectedPath['data-type'] === 'rectangle' ? [
                                {...dashedPath, key: 'rect-path', d: stringify(context.selectedPath.d)},
                                {...Point({x: context.selectedPath.d[0].args[0], y: context.selectedPath.d[0].args[1]}, 'full'), key: 'rect-topleft', on: {mousedown() {
                                    this.state.selectedPointCommand = 'rect-topleft';
                                    this.state.svgBindingRect = fixRect(this.element.getBoundingClientRect());
                                }}},
                                {...Point({x: context.selectedPath.d[2].args[0], y: context.selectedPath.d[2].args[1]}, 'full'), key: 'rect-bottomright', on: {mousedown() {
                                    this.state.selectedPointCommand = 'rect-bottomright';
                                    this.state.svgBindingRect = fixRect(this.element.getBoundingClientRect());
                                }}},
                            ] : (() => {
                                const center = getPolygonCenter(context.selectedPath);
                                const bottom = getPolygonBottom(context.selectedPath);
                                return [
                                    {...dashedPath, key: 'dashed-polygon-line', d: `M${center.x} ${center.y}L${bottom.x} ${bottom.y}`},
                                    {...Point(center, 'full'), key: 'polygon-center', on: {mousedown() {
                                        this.state.selectedPointCommand = 'polygon-center';
                                        this.state.svgBindingRect = fixRect(this.element.getBoundingClientRect());
                                    }}},
                                    {...Point(bottom, 'outline'), key: 'polygon-bottom', on: {mousedown() {
                                        this.state.selectedPointCommand = 'polygon-bottom';
                                        this.state.svgBindingRect = fixRect(this.element.getBoundingClientRect());
                                    }}}
                                ];
                            })()) : [])
                        ],
                        on: {
                            mousemove(e) {
                                if (this.state.selectedPointCommand) {
                                    const xProportion = (e.clientX - this.state.svgBindingRect.left) / this.state.svgBindingRect.width, yProportion = (e.clientY - this.state.svgBindingRect.top) / this.state.svgBindingRect.height;
                                    const xPos = Math.round(xProportion * context.icon.width), 
                                        yPos = Math.round(yProportion * context.icon.height);
                                    switch (this.state.selectedPointCommand) {
                                        case 'circle-center': {
                                            const center = getCircleCenter(context.selectedPath);
                                            if (xPos !== center.x || yPos !== center.y) {
                                                setCircleCenter(context.selectedPath, {x: xPos, y: yPos});
                                                this.rerender();
                                            }
                                            break;
                                        }
                                        case 'circle-right': {
                                            const right = getCircleRight(context.selectedPath);
                                            if (xPos !== right.x) {
                                                setCircleRight(context.selectedPath, xPos);
                                                this.rerender();
                                            }
                                            break;
                                        }
                                        case 'rect-topleft': {
                                            const args = context.selectedPath.d[0].args;
                                            if (xPos !== args[0] || yPos !== args[1]) {
                                                context.selectedPath.d[0].args = [xPos, yPos];
                                                context.selectedPath.d[1].args[1] = yPos;
                                                context.selectedPath.d[3].args[0] = xPos;
                                                this.rerender();
                                            }
                                            break;
                                        }
                                        case 'rect-bottomright': {
                                            const args = context.selectedPath.d[2].args;
                                            if (xPos !== args[0] || yPos !== args[1]) {
                                                context.selectedPath.d[2].args = [xPos, yPos];
                                                context.selectedPath.d[1].args[0] = xPos;
                                                context.selectedPath.d[3].args[1] = yPos;
                                                this.rerender();
                                            }
                                            break;
                                        }
                                        case 'polygon-center': {
                                            const center = getPolygonCenter(context.selectedPath);
                                            if (!approxEqual(xPos, center.x) || !approxEqual(yPos !== center.y)) {
                                                setPolygonCenter(context.selectedPath, {x: xPos, y: yPos});
                                                this.rerender();
                                            }
                                            break;
                                        }
                                        case 'polygon-bottom': {
                                            const center = getPolygonCenter(context.selectedPath);
                                            const oldSideRadius = getPolygonSideRadius(context.selectedPath);
                                            const newSideRadius = Math.abs(yPos - center.y);
                                            if (!approxEqual(oldSideRadius, newSideRadius)) {
                                                setPolygonSideRadius(context.selectedPath, newSideRadius);
                                                this.rerender();
                                            }
                                            break;
                                        }
                                        default: {
                                            if (xPos !== this.state.selectedPointCommand.args[this.state.xIndex] || yPos !== this.state.selectedPointCommand.args[this.state.xIndex + 1]) {
                                                this.state.selectedPointCommand.args[this.state.xIndex] = xPos;
                                                this.state.selectedPointCommand.args[this.state.xIndex + 1] = yPos;
                                                this.rerender();
                                            }
                                        }
                                    }
                                } else if (this.state.translatingPathName) {
                                    const xProportion = (e.clientX - this.state.svgBindingRect.left) / this.state.svgBindingRect.width, yProportion = (e.clientY - this.state.svgBindingRect.top) / this.state.svgBindingRect.height;
                                    const xPos = xProportion * context.icon.width, 
                                        yPos = yProportion * context.icon.height;
                                    const dx = Math.round(xPos - this.state.translatingPathStartCoords.x),
                                        dy = Math.round(yPos - this.state.translatingPathStartCoords.y);
                                    if (dx !== this.state.translatingPathOffsets.x || dy !== this.state.translatingPathOffsets.y) {
                                        context.icon.children.find(c => c['data-name'] === this.state.translatingPathName).d.forEach(cmd => translateCommandBy(cmd, {x: dx - this.state.translatingPathOffsets.x, y: dy - this.state.translatingPathOffsets.y}));
                                        this.state.translatingPathOffsets = {x: dx, y: dy};
                                        this.rerender();
                                    }
                                }
                            },
                            click(e) {
                                this.state.prospectiveTranslatingPathName = null;
                                if (this.state.selectedPointCommand) {
                                    this.state.selectedPointCommand = null;
                                    context.commit();
                                } else if (this.state.translatingPathName) {
                                    this.state.translatingPathName = null;
                                    context.commit();
                                } else if (context.selectedPath && !e.target.closest('svg > *:not([data-gridline=true])')) {
                                    context.selectedPath = null;
                                    context.commit();
                                }
                            },
                            mouseleave(e) {
                                this.state.prospectiveTranslatingPathName = null;
                                if (this.state.selectedPointCommand) {
                                    this.state.selectedPointCommand = null;
                                    context.commit();
                                } else if (this.state.translatingPathName) {
                                    this.state.translatingPathName = null;
                                    context.commit();
                                }
                            },
                            dblclick(e) {
                                if (e.target.closest('svg > *:not([data-gridline=true])')) return;
                                const svgBindingRect = fixRect(this.element.getBoundingClientRect());
                                const xProportion = (e.clientX - svgBindingRect.left) / svgBindingRect.width, yProportion = (e.clientY - svgBindingRect.top) / svgBindingRect.height;
                                const xPos = Math.round(xProportion * context.icon.width), 
                                    yPos = Math.round(yProportion * context.icon.height);
                                addPath('Path', {startCoord: {x: xPos, y: yPos}});
                            }
                        }
                    }
                }
            }
        ]
    };
}

export default Canvas;