import context from "./utils/context.js";
import LeftSidebar from "./components/LeftSidebar.js";
import Canvas from "./components/Canvas.js";
import RightSidebar from "./components/RightSidebar.js";
import FileModal from "./components/FileModal.js";
import PropertiesModal from "./components/PropertiesModal.js";

const App = {
    state() {
        context.rerender = () => this.rerender();
        return {};
    },
    render() {
        return {
            id: 'app',
            children: [
                LeftSidebar(),
                Canvas(),
                RightSidebar(),
                ...(context.modal ? [{
                    id: 'modal-wrapper',
                    on: {click(e) {
                        if (e.target !== this.target) return;
                        context.modal = null;
                        context.rerender();
                    }},
                    children: {
                        ...(context.modal === 'properties' ? PropertiesModal() : FileModal()),
                        id: 'modal'
                    }
                }] : [])
            ],
            on: {
                click(e) {
                    const floatingSet = new Set(document.getElementsByClassName('floating'));
                    let target = e.target;
                    while (target && target.id !== 'app') {
                        if (target.classList.contains('floating'))
                            floatingSet.delete(target);
                        if (target.classList.contains('floating-trigger'))
                            return;
                        target = target.parentElement;
                    }
                    for (const floating of floatingSet)
                        floating.hidden = true;
                }
            }
        };
    }
};

export default App;