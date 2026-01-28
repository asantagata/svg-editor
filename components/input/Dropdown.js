import SVGs from "../SVGs.js";

export default function Dropdown(getValue, onChange, options) {
    return {
        children: [
            {
                class: 'dropdown-trigger floating-trigger',
                children: [
                    {class: 'dropdown-trigger-content', innerHTML: options.find(({value}) => value === getValue()).label},
                    {innerHTML: SVGs.chevronDown}
                ],
                on: {
                    click() {
                        const popover = this.target.nextElementSibling;
                        const thisRect = this.target.getBoundingClientRect();
                        if (thisRect.y > window.innerHeight / 2) {
                            popover.style.bottom = `${window.innerHeight - thisRect.top}px`;
                            popover.style.top = 'unset';
                        } else {
                            popover.style.top = `${thisRect.bottom}px`;
                            popover.style.bottom = 'unset';
                        }
                        popover.hidden = !popover.hidden;
                    }
                }
            },
            {
                class: 'popover floating',
                hidden: true,
                children: options.map(({label, value}) => ({
                    tag: 'button',
                    innerHTML: label,
                    on: {click() {
                        if (getValue() !== value) {
                            onChange(value);
                        } else {
                            this.target.parentElement.hidden = true;
                        }
                    }}
                }))
            }
        ]
    }
} 