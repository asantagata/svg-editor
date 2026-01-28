import SVGs from "../SVGs.js";

export default function NumberInput(getValue, onChange = () => {}, {min = '', max = '', step = '0.01', showSpinButtons = true, placeholder = ''} = {}) {
    return {
        state() {
            return {
                lastSafeValue: getValue()
            }
        },
        render() {
            return {
                class: 'number-input-wrapper',
                children: [
                    {
                        tag: 'input',
                        binding: 'input',
                        type: 'number',
                        autocomplete: 'false',
                        value: `${getValue()}`,
                        min, max, step, placeholder,
                        on: {
                            change(e) {
                                const n = e.target.valueAsNumber;
                                if ((min === '' || n >= min) && (max === '' || n <= max)) {
                                    this.state.lastSafeValue = n;
                                    e.target.value = n;
                                    onChange(n);
                                } else {
                                    e.preventDefault();
                                    e.target.value = this.state.lastSafeValue;
                                }
                            }
                        }
                    },
                    ...(showSpinButtons ? [{
                        class: 'spin-button-wrapper',
                        children: [
                            {
                                class: 'spin-button',
                                innerHTML: SVGs.chevronUp,
                                on: {click() {
                                    const n = this.bindings.input.element.valueAsNumber + 1;
                                    if (max === '' || n <= max) {
                                        this.state.lastSafeValue = n;
                                        this.bindings.input.element.value = n;
                                        onChange(n);
                                    }
                                }}
                            },
                            {
                                class: 'spin-button',
                                innerHTML: SVGs.chevronDown,
                                on: {click() {
                                    const n = this.bindings.input.element.valueAsNumber - 1;
                                    if (min === '' || n >= min) {
                                        this.state.lastSafeValue = n;
                                        this.bindings.input.element.value = n;
                                        onChange(n);
                                    }
                                }}
                            }
                        ]
                    }] : [])
                ]
            }
        }
    }
};