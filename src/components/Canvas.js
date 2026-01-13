import context from "../utils/context.js";
import { selectPath } from "../utils/path.js";
import { isolateCoordsFromAbsoluteCmd } from "../utils/d.js";
import { getIconSVG } from "../utils/svg.js";
import Grid from "./svg/Grid.js";
import Point from "./svg/Point.js";

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
                        svgBindingRect: null
                    };
                },
                render() {
                    return {
                        ...context.iconSVG,
                        children: [
                            ...Grid(context.icon.width, context.icon.height),
                            ...getIconSVG().children.map(path => ({
                                ...path, 
                                key: `path-${path['data-name']}`,
                                stroke: context.selectedPath && context.selectedPath['data-name'] === path['data-name']
                                    ? highlightedPathColor : 'currentColor', 
                                binding: context.selectedPath && context.selectedPath['data-name'] === path['data-name']
                                    ? 'selected-path' : undefined,
                                on: {click() { 
                                    selectPath(context.icon.children
                                        .find(child => child['data-name'] === path['data-name'])) 
                                    }}
                                })
                            ),

                            ...(context.selectedPath ? [
                                {
                                    tag: 'path', 
                                    xmlns: 'http://www.w3.org/2000/svg', 
                                    'stroke-linecap': 'round',
                                    'stroke-linejoin': 'round',
                                    'stroke-width': overlayPathWidth,
                                    stroke: overlayPathColor,
                                    key: 'overlay-selected-path',
                                    binding: 'overline',
                                    d: context.selectedPath.d.map((command, index) => {    
                                        let coords = isolateCoordsFromAbsoluteCmd(command, context.selectedPath.d);
                                        const verb = index ? 'L' : 'M';
                                        return `${verb}${coords.x} ${coords.y}`;
                                    }).join('')
                                },
                                ...context.selectedPath.d.map((command) => {
                                    if (command.type === 'Z') return false;
                                    const coords = isolateCoordsFromAbsoluteCmd(command, context.selectedPath.d);
                                    return {...Point(coords), key: `endpoint${command.id}`, binding: `endpoint-${command.id}`, on: {
                                        mousedown() {
                                            this.state.selectedPointCommand = command;
                                            this.state.xIndex = command.args.length - 2;
                                            this.state.selectedPointCommandOriginalArgs = [...command.args];
                                            this.state.svgBindingRect = fixRect(this.element.getBoundingClientRect());
                                        }
                                    }};
                                }).filter(x => x)
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
                                    // if (difference) ...
                                    context.commit();
                                }
                            },
                            mouseleave(e) {
                                if (this.state.selectedPointCommand) {
                                    this.state.selectedPointCommand = null;
                                    // if (difference) ...
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