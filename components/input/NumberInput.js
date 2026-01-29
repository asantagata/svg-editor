import SVGs from "../SVGs.js";

function stringify(n) {
    return Number(n.toFixed(2));
}

export default function NumberInput(getValue, onChange = () => {}, {min = '', max = '', step = '', showSpinButtons = true, placeholder = ''} = {}) {
    return {
        state() {
            return {
                lastSafeValue: getValue()
            }
        },
        render() {
            if (this.element) {
                // prevent stale values
                this.bindings.input.element.valueAsNumber = stringify(getValue());
            }
            return {
                class: 'number-input-wrapper',
                children: [
                    {
                        tag: 'input',
                        binding: 'input',
                        type: 'number',
                        autocomplete: 'false',
                        value: stringify(getValue()),
                        min, max, step, placeholder,
                        on: {
                            change(e) {
                                const n = e.target.valueAsNumber;
                                if (!Number.isNaN(n) && (min === '' || n >= min) && (max === '' || n <= max) && (step === '' || n % step === 0)) {
                                    this.state.lastSafeValue = n;
                                    e.target.value = stringify(n);
                                    onChange(n);
                                } else {
                                    e.preventDefault();
                                    e.target.value = stringify(this.state.lastSafeValue);
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
                                        this.bindings.input.element.value = stringify(n);
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
                                        this.bindings.input.element.value = stringify(n);
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