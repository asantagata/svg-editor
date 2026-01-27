import context from "../utils/context.js";
import NumberInput from "./input/NumberInput.js";

export default function FileModal() {
    return {
        children: [
            {
                class: 'option-wrapper',
                children: [
                    'Width',
                    NumberInput(() => context.icon.width, (val) => {
                        context.icon.width = val; context.commit();
                    }, {min: 0})
                ]
            },
            {
                class: 'option-wrapper',
                children: [
                    'Height',
                    NumberInput(() => context.icon.height, (val) => {
                        context.icon.height = val; context.commit();
                    }, {min: 0})
                ]
            }
        ]
    };
}