import { insertCommand, setCommandType } from "../utils/d.js";
import context from "../utils/context.js";
import CommandArguments, { SpecialCommandArguments } from "./CommandArguments.js";
import Dropdown from "./input/Dropdown.js";
import SVGs from "./SVGs.js";

export function selectCommandFromList(command) {
    const element = document.querySelector(`#command-list > .command[data-key=command-${command.id}]`);
    if (!element) return;
    element.scrollIntoView({behavior: 'smooth', block: 'center'}); 
    element.animate([
        {background: 'var(--c-halftext)'},
        {background: 'var(--c-back)'}
    ], {
        duration: 500,
        easing: 'ease-out',
    });
}

function NewCommandBar(index) {
    return {
        class: 'new-command-bar',
        key: `new-${index}`,
        children: [
            {value: 'M', label: 'Move'},
            {value: 'L', label: 'Line'},
            {value: 'Q', label: 'Quadratic Bézier curve'},
            {value: 'C', label: 'Cubic Bézier curve'},
            {value: 'A', label: 'Elliptical arc'},
            {value: 'Z', label: 'Close path'}
        ].map(({value, label}) => ({
            class: 'new-command-button',
            innerHTML: SVGs[`addCommand${value}`],
            title: `New "${label}" command`,
            on: {click() {
                insertCommand(value, index);
                context.commit();
            }}
        }))
    };
}

function CommandItem(command, index) {
    return {
        class: 'command',
        key: `command-${command.id}`,
        children: [
            index !== 0 ?
            {
                class: 'command-heading',
                children: [
                    Dropdown(
                        () => command.type,
                        (value) => {
                            setCommandType(command, value);
                            context.commit();
                        },
                        [
                            {value: 'M', label: `${SVGs.commandM} Move`},
                            {value: 'L', label: `${SVGs.commandL} Line`},
                            {value: 'Q', label: `${SVGs.commandQ} Quadratic Bézier curve`},
                            {value: 'C', label: `${SVGs.commandC} Cubic Bézier curve`},
                            {value: 'A', label: `${SVGs.commandA} Elliptical arc`},
                            {value: 'Z', label: `${SVGs.commandZ} Close path`}
                        ]
                    ),
                    {
                        class: 'x-button',
                        innerHTML: SVGs.delete,
                        on: {
                            click() {
                                context.selectedPath.d = context.selectedPath.d.filter(c => c !== command);
                                context.commit();
                            }
                        }
                    }
                ]
            } : {
                class: 'first-command-heading',
                innerHTML: `${SVGs.commandM} Move`
            },
            ...(command.type === 'Z' ? [] : [CommandArguments(command)])
        ]
    };
}

const specialPathTypes = new Set(['circle', 'rectangle', 'polygon']);

export default function CommandList(d) {
    return {
        class: 'command-list',
        id: 'command-list',
        children: specialPathTypes.has(context.selectedPath['data-type']) ? {class: 'command', children: SpecialCommandArguments(context.selectedPath['data-type'], context.selectedPath)} : d.flatMap((command, i) => [
            CommandItem(command, i),
            NewCommandBar(i)
        ])
    }
}