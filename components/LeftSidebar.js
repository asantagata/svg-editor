import context from "../utils/context.js";
import { addPath, selectPath, addImportedSVGPaths } from "../utils/path.js";
import SVGs from "./SVGs.js";
import Demos from "./Demos.js";
import Exports from "./Exports.js";
import { getAllFromDB } from "../utils/persistence.js";
import { uploadSVG, pasteSVG } from "../utils/reader.js";

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
                        key: 'name',
                        tag: 'button',
                        innerHTML: `${SVGs[p['data-type']]} ${p['data-name']}`,
                        on: {click() {
                            selectPath(p);
                        }}
                    },
                    ...(context.icon.children.length > 1 && p === context.selectedPath ? [{
                        key: 'show-hide-all',
                        title: context.icon.children.every(c => c.style?.display || c === context.selectedPath) ? `Show all` : `Hide all`,
                        tag: 'button',
                        class: 'icon-button',
                        innerHTML: context.icon.children.every(c => c.style?.display || c === context.selectedPath) 
                            ? SVGs.showAll : SVGs.hideAll,
                        on: {click() {
                            if (context.icon.children.every(c => c.style?.display || c === context.selectedPath)) {
                                context.icon.children.forEach(c => {
                                    if (c !== context.selectedPath)
                                        c.style = {display: ''};
                                });
                            } else {
                                context.icon.children.forEach(c => {
                                    if (c !== context.selectedPath)
                                        c.style = {display: 'none'};
                                });
                            }
                            context.commit();
                        }}
                    }] : []),
                    {
                        key: 'show-hide-me',
                        tag: 'button',
                        class: 'icon-button',
                        title: p.style?.display ? 'Show' : 'Hide',
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
                        key: 'copy',
                        tag: 'button',
                        class: 'icon-button',
                        title: 'Copy',
                        innerHTML: SVGs.copy,
                        on: {click() {
                            addPath(p['data-type'][0].toUpperCase() + p['data-type'].slice(1), p);
                        }}
                    },
                    {
                        key: 'delete',
                        tag: 'button',
                        class: 'icon-button',
                        title: 'Delete',
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
                {tag: 'button', on: {click() {addPath('Rectangle')}}, innerHTML: `${SVGs.rectangle} Add rectangle`},
                {tag: 'button', on: {click() {addPath('Polygon')}}, innerHTML: `${SVGs.polygon} Add polygon`},
                {tag: 'button', on: {click() {addPath('Bone')}}, innerHTML: `${SVGs.bone} Add bone`},
                {tag: 'button', on: {click() {
                    getAllFromDB().then(r => {
                        context.saves = r;
                        context.modal = 'additive';
                        context.rerender();
                    });
                }}, innerHTML: `${SVGs.document} Add from saved`},
                {tag: 'button', on: {click() {
                    uploadSVG().then(addImportedSVGPaths);
                }}, innerHTML: `${SVGs.upload} Upload from device`},
                {tag: 'button', on: {click() {
                    pasteSVG().then(addImportedSVGPaths);
                }}, innerHTML: `${SVGs.clipboard} Paste`}
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
                children: [
                    {children: 'SVG Editor'},
                    {
                        class: 'modal-buttons',
                        children: [
                            {tag: 'h2', class: 'h2-button', on: {click() {
                                context.modal = 'properties';
                                context.rerender();
                            }}, children: 'SVG properties'},
                            {tag: 'h2', class: 'h2-button', on: {click() {
                                getAllFromDB().then(r => {
                                    context.saves = r;
                                    context.modal = 'saved';
                                    context.rerender();
                                });
                            }}, children: 'Saved SVGs'},
                        ]
                    }
                ]
            },
            {
                class: 'paths-wrapper',
                children: [
                    {
                        class: 'flex-between',
                        key: 'header',
                        children: [
                            {tag: 'h2', children: 'Paths', key: 'header'},
                            ...(context.selectedPath ? [{tag: 'h2', class: 'h2-button', key: 'deselect-paths', children: `Deselect path`, on: {click() {
                                context.selectedPath = null;
                                context.commit();
                            }}}] : [])
                        ]
                    },
                    PathList(),
                    NewButton
                ]
            },
            {
                class: 'sidebar-section',
                children: [
                    {tag: 'h2', children: 'Demos'},
                    Demos()
                ]
            },
            {
                class: 'sidebar-section',
                children: [
                    {tag: 'h2', children: 'Exports'},
                    Exports()
                ]
            },
        ]
    }
};

export default LeftSidebar;