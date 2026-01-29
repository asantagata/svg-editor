import context from "../utils/context.js";

export default function WarningModal() {
    return {
        class: 'warning-modal',
        children: [
            {class: 'warning-body', children: context.warning.body},
            {class: 'flex-between default-right', children: [
                ...(context.warning.leftButton ? [
                    {tag: 'button', class: 'cancel-button', children: context.warning.leftButton.text, on: {click() {
                        context.warning.leftButton.onClick();
                        context.modal = '';
                        context.rerender();
                    }}}
                ] : []),
                {tag: 'button', children: context.warning.button.text, on: {click() {
                    context.warning.button.onClick();
                    context.modal = '';
                    context.rerender();
                }}}
            ]}
        ]
    };
}