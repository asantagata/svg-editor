export default function SegmentedControl(getValue, onChange, options, vertical = false) {
    return {
        class: {'segmented-control': true, vertical},
        children: options.map(option => ({
            class: {'segmented-control-option': true, 'segmented-control-selected': option.value === getValue()},
            innerHTML: option.label,
            on: {click() {
                if (option.value !== getValue())
                    onChange(option.value);
            }}
        }))
    }
}