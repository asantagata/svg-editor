import context from "../utils/context.js";
import { getIconSVG } from "../utils/svg.js";
import SVGs from "./SVGs.js";
import { deleteFromDB } from "../utils/persistence.js";

function getDateString(lastModified) {
    if (!lastModified) return 'No date';
    const date = new Date(lastModified);
    const now = new Date();
    const dateIsToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
    if (!dateIsToday) {
        return date.toLocaleDateString();
    } else {
        return date.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }
}

export default function FileModal() {
    return {
        children: {
            tag: 'table',
            children: {
                tag: 'tbody',
                children: context.saves.length ? context.saves.map(file => ({
                    key: file.id,
                    tag: 'tr',
                    class: {'file-info': true, 'openable-file-info': file.id !== context.id},
                    children: [
                        {tag: 'td', children: {
                            tag: 'button', children: getIconSVG(file.icon)
                        }},
                        {tag: 'td', class: 'file-data', children: [
                            {children: file.name},
                            {tag: 'h2', children: getDateString(file.lastModified)}
                        ]},
                        {tag: 'td', class: 'delete-td', children: {
                            tag: 'button', innerHTML: SVGs.delete, on: {click() {
                                deleteFromDB(file.id);
                                context.saves = context.saves.filter(f => f !== file);
                                context.rerender();
                            }}
                        }}
                    ],
                    on: {click(e) {
                        if (e.target.closest('.delete-td')) return;
                        Object.assign(context, file);
                        context.selectedPath = null;
                        context.modal = null;
                        context.saves = null;
                        context.rerender();
                    }}
                })) : {class: 'no', style: {padding: '5dvh'}, children: 'No SVGs saved'}
            }
        }
    };
}