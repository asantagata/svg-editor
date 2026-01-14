import context from "../utils/context.js";
import { selectPath } from "../utils/path.js";
import { isolateCoordsFromAbsoluteCmd, insertCommand, setCommandType } from "../utils/d.js";
import { getIconSVG } from "../utils/svg.js";
import Grid from "./svg/Grid.js";
import Point from "./svg/Point.js";
import { selectCommandFromList } from "./CommandList.js";

const highlightedPathColor = '#D693AA';
const overlayPathColor = '#EACCD6';
const overlayPathWidth = '0.1';

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

function pointMousedownListener(thisArg, command, xIndex = null) {
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
                        plusCommandId: -1
                    };
                },
                render() {
                    return {
                        ...context.iconSVG,
                        dataset: {
                            dragging: !!this.state.selectedPointCommand
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
                                    selectPath(context.icon.children
                                        .find(child => child['data-name'] === path['data-name'])) 
                                    }}
                                })
                            ),

                            // underline path
                            ...(context.selectedPath ? [
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
                                    tag: 'path', 
                                    xmlns: 'http://www.w3.org/2000/svg', 
                                    'stroke-linecap': 'round',
                                    'stroke-linejoin': 'round',
                                    'stroke-width': overlayPathWidth,
                                    stroke: overlayPathColor + 'C0',
                                    key: 'overlay-selected-path-controls',
                                    'stroke-dasharray': '0.2 0.2',
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
                                            click() {
                                                if (command.id === this.state.plusCommandId) {
                                                    setCommandType(command, 'L');
                                                    this.state.plusCommandId = -1;
                                                    insertCommand('L', context.selectedPath.d.findIndex(cmd => cmd.id === command.id) - 1);
                                                    context.commit();
                                                } else {
                                                    selectCommandFromList(command);
                                                    this.state.plusCommandId = command.id;
                                                    this.rerender();
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
                                            pointMousedownListener(this, command);
                                        }
                                    }};
                                    if (command.type === 'C' || command.type === 'Q') {
                                        const startControl = {...Point({x: command.args[0], y: command.args[1]}, 'outline'), key: `startcontrol${command.id}`, on: {
                                            mousedown() {
                                                pointMousedownListener(this, command, 0);
                                            }
                                        }};
                                        if (command.type === 'Q') return [startControl, endpoint];
                                        const endControl = {...Point({x: command.args[2], y: command.args[3]}, 'outline'), key: `endcontrol${command.id}`, on: {
                                            mousedown() {
                                                pointMousedownListener(this, command, 2);
                                            }
                                        }};
                                        return [startControl, endControl, endpoint];
                                    } else return endpoint;
                                })
                            ] : [])
                        ],
                        on: {
                            mousemove(e) {
                                if (this.state.selectedPointCommand) {
                                    const xProportion = (e.clientX - this.state.svgBindingRect.left) / this.state.svgBindingRect.width, yProportion = (e.clientY - this.state.svgBindingRect.top) / this.state.svgBindingRect.height;
                                    const xPos = Math.round(xProportion * context.icon.width), 
                                        yPos = Math.round(yProportion * context.icon.height);
                                    const currentX = this.state.selectedPointCommand.args[this.state.xIndex],
                                        currentY = this.state.selectedPointCommand.args[this.state.xIndex + 1];
                                    if (xPos !== currentX || yPos !== currentY) {
                                        this.state.selectedPointCommand.args[this.state.xIndex] = xPos;
                                        this.state.selectedPointCommand.args[this.state.xIndex + 1] = yPos;
                                        this.rerender();
                                    }
                                }
                            },
                            mouseup(e) {
                                if (this.state.selectedPointCommand) {
                                    this.state.selectedPointCommand = null;
                                    context.commit();
                                }
                            },
                            mouseleave(e) {
                                if (this.state.selectedPointCommand) {
                                    this.state.selectedPointCommand = null;
                                    context.commit();
                                }
                            }
                        }
                    }
                }
            }
        ]
    };
}

export default Canvas;