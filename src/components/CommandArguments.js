import NumberInput from "./input/NumberInput.js";
import SVGs from "./SVGs.js";
import SegmentedControl from "./input/SegmentedControl.js";
import context from "../utils/context.js";

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
                        SegmentedControlShorthand(command, 3, ['sweepOn', 'sweepOff']),
                        SegmentedControlShorthand(command, 4, ['clockwise', 'counterclockwise']),
                    ]
                },
                LabelledInput('Destination', PointInput(command, 5, 6))
            ],
        }[command.type]
    };
}


/**
    command.args.map((a, i) => NumberInput(
        () => a,
        (value) => {
            command.args[i] = value;
            context.commit();
        }
    ))
 */