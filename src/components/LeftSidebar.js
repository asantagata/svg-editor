import context from "../utils/context.js";
import { addPath, selectPath } from "../utils/path.js";
import SVGs from "./SVGs.js";

function PathList() {
    if (context.icon.children.length) {
        return {
            key: 'path-list',
            id: 'path-list',
            children: context.icon.children.map(p => ({
                key: p['data-name'],
                class: {'multi-button': true, 'selected-path': p === context.selectedPath},
                children: [
                    {
                        tag: 'button',
                        innerHTML: `${SVGs[p['data-type']]} ${p['data-name']}`,
                        on: {click() {
                            selectPath(p);
                        }}
                    },
                    {
                        tag: 'button',
                        class: 'icon-button',
                        innerHTML: p.style?.display ? SVGs.show : SVGs.hide,
                        on: {click() {
                            if (p.style?.display) {
                                p.style = {display: ''};
                            } else {
                                p.style = {display: 'none'};
                            }
                            context.commit();
                        }}
                    },
                    {
                        tag: 'button',
                        class: 'icon-button',
                        innerHTML: SVGs.copy,
                        on: {click() {
                            addPath(p['data-type'][0].toUpperCase() + p['data-type'].slice(1), p);
                        }}
                    },
                    {
                        tag: 'button',
                        class: 'icon-button',
                        innerHTML: SVGs.delete,
                        on: {click() {
                            if (p === context.selectedPath)
                                context.selectedPath = null;
                            context.icon.children = context.icon.children.filter(c => c !== p);
                            context.commit();
                        }}
                    }
                ]
            }))
        };
    } else {
        return {key: 'no', class: 'no', children: 'No paths'};
    }
}

const NewButton = {
    key: 'new-button',
    children: [
        {
            class: 'button multi-button',
            children: [
                {tag: 'button', children: 'Add path', on: {click() {addPath()}}},
                {tag: 'button', class: 'icon-button floating-trigger', innerHTML: SVGs.chevronDown, on: {click() {
                    const popover = document.getElementById('path-template-popover');
                    const thisRect = this.target.getBoundingClientRect();
                    if (thisRect.y > window.innerHeight / 2) {
                        popover.style.bottom = `${window.innerHeight - thisRect.top}px`;
                        popover.style.top = 'unset';
                    } else {
                        popover.style.top = `${thisRect.bottom}px`;
                        popover.style.bottom = 'unset';
                    }
                    popover.hidden = !popover.hidden;
                }}},
            ]
        },
        {
            class: 'popover floating',
            id: 'path-template-popover',
            hidden: true,
            children: [
                {tag: 'button', on: {click() {addPath('Circle')}}, innerHTML: `${SVGs.circle} Add circle`},
                {tag: 'button', on: {click() {addPath('Square')}}, innerHTML: `${SVGs.square} Add square`},
                {tag: 'button', on: {click() {addPath('Bone')}}, innerHTML: `${SVGs.bone} Add bone`}
            ]
        }
    ]
};

function LeftSidebar() {
    return {
        class: 'sidebar',
        id: 'left-sidebar',
        children: [
            {
                children: 'SVG Editor'
            },
            {
                class: 'paths-wrapper',
                children: [
                    {tag: 'h2', children: 'Paths', key: 'header'},
                    PathList(),
                    NewButton
                ]
            },
            {
                children: [
                    {tag: 'h2', children: 'Demos'}
                ]
            }
        ]
    }
};

export default LeftSidebar;