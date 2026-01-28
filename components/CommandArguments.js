import NumberInput from "./input/NumberInput.js";
import SVGs from "./SVGs.js";
import SegmentedControl from "./input/SegmentedControl.js";
import context from "../utils/context.js";
import { getCircleCenter, getCircleRadius, setCircleCenter, setCircleRadius } from "../utils/special-path.js";

function SegmentedControlShorthand(command, index, svgKeys) {
    return SegmentedControl(
        () => command.args[index],
        (value) => {
            command.args[index] = value;
            context.commit();
        },
        svgKeys.map((key, i) => ({value: i, label: SVGs[key]})), 
        true
    );
}

function NumberInputShorthand(command, index, placeholder = '') {
    return NumberInput(
        () => command.args[index],
        (value) => {
            command.args[index] = value;
            context.commit();
        },
        {placeholder}
    );
}

function PointInput(command, xIndex, yIndex) {
    return {
        class: 'point-input',
        children: ['(', NumberInputShorthand(command, xIndex), {children: ',', class: 'point-comma'}, NumberInputShorthand(command, yIndex), ')']
    };
}

function LabelledInput(label, input) {
    return {
        children: [
            {tag: 'label', children: label},
            input
        ]
    };
}

export default function CommandArguments(command) {
    return {
        class: 'command-arguments',
        children: {
            M: [LabelledInput('Destination', PointInput(command, 0, 1))],
            L: [LabelledInput('Destination', PointInput(command, 0, 1))],
            Q: [
                LabelledInput('Control point', PointInput(command, 0, 1)),
                LabelledInput('Destination', PointInput(command, 2, 3))
            ],
            C: [
                LabelledInput('Start control point', PointInput(command, 0, 1)),
                LabelledInput('End control point', PointInput(command, 2, 3)),
                LabelledInput('Destination', PointInput(command, 4, 5))
            ],
            A: [
                LabelledInput('Radii', PointInput(command, 0, 1)),
                {
                    class: 'input-flex', 
                    children: [
                        LabelledInput('Angle', NumberInputShorthand(command, 2, '0°')),
                        SegmentedControlShorthand(command, 3, ['smallArc', 'largeArc']),
                        SegmentedControlShorthand(command, 4, ['clockwise', 'counterclockwise']),
                    ]
                },
                LabelledInput('Destination', PointInput(command, 5, 6))
            ],
        }[command.type]
    };
}

export function SpecialCommandArguments(type, path) {
    if (type === 'circle') {
        return {
            class: 'command-arguments',
            children: [
                LabelledInput('Center', {class: 'point-input',
                children: ['(', NumberInput(
                    () => getCircleCenter(path).x,
                    (value) => {
                        setCircleCenter(path, {x: value, y: getCircleCenter(path).y})
                        context.commit();
                    }
                ), {children: ',', class: 'point-comma'}, NumberInput(
                    () => getCircleCenter(path).y,
                    (value) => {
                        setCircleCenter(path, {y: value, x: getCircleCenter(path).x})
                        context.commit();
                    }
                ), ')']}),
                LabelledInput('Radius', NumberInput(
                    () => getCircleRadius(path),
                    (value) => {
                        setCircleRadius(path, value);
                        context.commit();
                    },
                    {min: 0}
                ))
            ]
        }
    } else {
        return {
            class: 'command-arguments',
            children: [
                LabelledInput('Corner', {class: 'point-input',
                children: ['(', NumberInput(
                    () => path.d[0].args[0],
                    (value) => {
                        path.d[0].args[0] = value;
                        path.d[3].args[0] = value;
                        context.commit();
                    }
                ), {children: ',', class: 'point-comma'}, NumberInput(
                    () => path.d[0].args[1],
                    (value) => {
                        path.d[0].args[1] = value;
                        path.d[1].args[1] = value;
                        context.commit();
                    }
                ), ')']}),LabelledInput('Corner', {class: 'point-input',
                children: ['(', NumberInput(
                    () => path.d[2].args[0],
                    (value) => {
                        path.d[2].args[0] = value;
                        path.d[1].args[0] = value;
                        context.commit();
                    }
                ), {children: ',', class: 'point-comma'}, NumberInput(
                    () => path.d[2].args[1],
                    (value) => {
                        path.d[2].args[1] = value;
                        path.d[3].args[1] = value;
                        context.commit();
                    }
                ), ')']}),
            ]
        }
    }
}