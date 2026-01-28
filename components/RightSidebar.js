import context from "../utils/context.js";
import SegmentedControl from "./input/SegmentedControl.js";
import NumberInput from "./input/NumberInput.js";
import SVGs from "./SVGs.js";
import CommandList from "./CommandList.js";

function RightSidebar() {
    return {
        class: 'sidebar',
        id: 'right-sidebar',
        children: !context.selectedPath ? {
            key: 'no-path-selected',
            class: 'no',
            children: 'No path selected'
        } : [{
                key: `data-${context.selectedPath['data-name']}`,
                class: 'data-section',
                children: [
                    {
                        class: 'flex-between',
                        children: [
                            {tag: 'h2', children: 'Data'},
                            ...(context.selectedPath['data-type'] === 'square' || context.selectedPath['data-type'] === 'circle' ? [{tag: 'h2', class: 'h2-button', children: 'Make path', on: {click() {
                                context.selectedPath['data-type'] = 'path';
                                context.commit();
                            }}}] : [])
                        ]
                    },
                    CommandList(context.selectedPath.d)
                ]
            },
            {
                key: `options-${context.selectedPath['data-name']}`,
                class: 'options-section sidebar-section',
                children: [
                    {
                        class: 'flex-between',
                        children: [
                            {tag: 'h2', children: 'Options'},
                            {tag: 'h2', class: 'h2-button', children: `Set default`, on: {click() {
                                context.defaultPath = {
                                    'stroke-linecap': context.selectedPath['stroke-linecap'],
                                    'stroke-linejoin': context.selectedPath['stroke-linejoin'],
                                    'fill': context.selectedPath['fill'],
                                    'stroke-width': context.selectedPath['stroke-width'],
                                };
                                context.commit();
                            }}}
                        ]
                    },
                    {class: 'option-wrapper', children: [                    
                        'Line cap',
                        SegmentedControl(
                            () => context.selectedPath['stroke-linecap'],
                            (value) => {
                                context.selectedPath['stroke-linecap'] = value;
                                context.commit();
                            },
                            [
                                {label: SVGs.linecapButt, value: 'butt'},
                                {label: SVGs.linecapRound, value: 'round'},
                                {label: SVGs.linecapSquare, value: 'square'},
                            ]
                        )
                    ]},
                    {class: 'option-wrapper', children: [                    
                        'Line join',
                        SegmentedControl(
                            () => context.selectedPath['stroke-linejoin'],
                            (value) => {
                                context.selectedPath['stroke-linejoin'] = value;
                                context.commit();
                            },
                            [
                                {label: SVGs.linejoinBevel, value: 'bevel'},
                                {label: SVGs.linejoinRound, value: 'round'},
                                {label: SVGs.linejoinMiter, value: 'miter'},
                            ]
                        )
                    ]},
                    {class: 'option-wrapper', children: [                    
                        'Stroke width',
                        NumberInput(
                            () => context.selectedPath['stroke-width'],
                            (value) => {
                                context.selectedPath['stroke-width'] = value;
                                context.commit();
                            },
                            {min: 0}
                        )
                    ]},
                    {class: 'option-wrapper', children: [                    
                        'Fill',
                        SegmentedControl(
                            () => context.selectedPath['fill'],
                            (value) => {
                                context.selectedPath['fill'] = value;
                                context.commit();
                            },
                            [
                                {label: SVGs.square, value: 'none'},
                                {label: SVGs.squareFilled, value: 'currentColor'},
                            ]
                        )
                    ]},
                ]
            }
        ]
    };
}

export default RightSidebar;