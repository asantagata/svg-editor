import context from "../utils/context.js";
import SVGs from "./SVGs.js";

function getHTML() {
    return document.getElementById('demos').children[0].children[0].outerHTML.replace(/ data-\w+="[^"]*?"/g, '').replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
}

function getFRUIT() {
    return `{
    tag: 'svg',
    xmlns: 'http://www.w3.org/2000/svg',
    stroke: 'currentColor',
    width: ${context.icon.width},
    height: ${context.icon.height},
    viewBox: '0 0 ${context.icon.width} ${context.icon.height}',
    children: [
    ${context.icon.children.map((c, i) => `      {
            tag: 'path',
            xmlns: 'http://www.w3.org/2000/svg',
            'stroke-linecap': '${c['stroke-linecap']}',
            'stroke-linejoin': '${c['stroke-linejoin']}',
            fill: '${c['fill']}',
            'stroke-width': ${c['stroke-width']},
            d: '${context.iconSVG.children[i].d}'
        }`).join(',\n')}
    ]
}`;
}

function copyText(text) {
    navigator.clipboard.writeText(text);
    // notify
}

function downloadText(text, extension) {
    const filename = `${context.name.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase())}.${extension}`;
    const blob = new Blob([text], { type: extension === 'svg' ? 'image/svg+xml' : '' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function checkButton(innerHTML, onClick) {
    return {tag: 'button', class: 'check-button', innerHTML: `${innerHTML} ${SVGs.check}`, on: {click() {
        this.target.classList.add('clicked');
        window.setTimeout(() => {
            this.target.classList.remove('clicked');
        }, 400)
        onClick();
    }}};
}

export default function Exports() {
    return {
        id: 'exports',
        children: [
            {
                class: 'export',
                children: [
                    {class: 'flex', innerHTML: SVGs.HTML},
                    {children: '<svg xmlns="http://www.w3.org/2000/svg" width="'},
                    checkButton(SVGs.copy, () => copyText(getHTML())),
                    checkButton(SVGs.download, () => downloadText(getHTML(), 'svg'))
                ]
            },
            {
                class: 'export',
                children: [
                    {class: 'flex', innerHTML: SVGs.FRUIT},
                    {children: `{tag: 'svg', xmlns: "http://www.w3.org/2000/svg", width: "`},
                    checkButton(SVGs.copy, () => copyText(getFRUIT())),
                    checkButton(SVGs.download, () => downloadText(`export default SVG = ${getFRUIT()};`, 'js'))
                ]
            }
        ]
    };
}