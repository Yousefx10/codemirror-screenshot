// src/main.js
import { EditorState } from '@codemirror/state';
import { EditorView, ViewPlugin } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

import { takeScreenshot } from './screenshot.js';

const initialCode = `// Welcome to the CodeMirror 6 Screenshot Tool!
// 1. Select a block of code you want to capture.
// 2. Click the floating Capture Button or the "Take Screenshot" button.
// 3. The generated image will appear below.

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(\`Fibonacci(10) is \${result}\`);

class Greeter {
  constructor(name) { this.name = name; }
  greet() { return \`Hello, \${this.name}!\`; }
}
`;

// Elements
const editorParent = document.getElementById('editor');
const screenshotBtn = document.getElementById('screenshot-btn');
const resultContainer = document.getElementById('result-container');

// Floating selection screenshot button
function selectionScreenshotButton(resultEl) {
    return ViewPlugin.fromClass(class {
        constructor(view) {
            this.view = view;
            this.scroller = view.scrollDOM;

            if (getComputedStyle(this.scroller).position === 'static') {
                this.scroller.style.position = 'relative';
            }

            this.btn = document.createElement('button');
            this.btn.type = 'button';
            this.btn.textContent = 'Capture';
            this.btn.title = 'Screenshot selection';
            Object.assign(this.btn.style, {
                position: 'absolute',
                zIndex: 10,
                padding: '6px 10px',
                fontSize: '13px',
                lineHeight: '1',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,.2)',
                background: 'white',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,.2)',
                transform: 'translate(-50%, -100%)',
                display: 'none',
                userSelect: 'none'
            });

            this.btn.addEventListener('mousedown', (e) => e.preventDefault());
            this.btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    this.btn.disabled = true;
                    this.btn.style.opacity = '0.7';
                    await takeScreenshot(this.view, resultEl, null);
                } finally {
                    this.btn.disabled = false;
                    this.btn.style.opacity = '';
                }
            });

            this.scroller.appendChild(this.btn);

            this._pending = false;
            this._measure = null;
            this._onScroll = () => this.scheduleMeasure();
            this.scroller.addEventListener('scroll', this._onScroll, { passive: true });

            this.scheduleMeasure();
        }

        update(update) {
            if (update.docChanged || update.selectionSet || update.viewportChanged) {
                this.scheduleMeasure();
            }
        }

        scheduleMeasure() {
            if (this._pending) return;
            this._pending = true;

            this.view.requestMeasure({
                read: () => {
                    this._pending = false;

                    const sel = this.view.state.selection.main;
                    if (!sel || sel.empty) {
                        this._measure = null;
                        return;
                    }

                    const from = this.view.coordsAtPos(sel.from);
                    const to = this.view.coordsAtPos(sel.to);
                    if (!from || !to) {
                        this._measure = null;
                        return;
                    }

                    const scRect = this.scroller.getBoundingClientRect();
                    const minX = Math.min(from.left, to.left);
                    const minY = Math.min(from.top, to.top);

                    const left = (minX - scRect.left) + this.scroller.scrollLeft;
                    const top  = (minY - scRect.top) + this.scroller.scrollTop - 8;

                    this._measure = { left, top };
                },
                write: () => {
                    if (!this._measure) {
                        this.btn.style.display = 'none';
                        return;
                    }
                    this.btn.style.left = `${this._measure.left}px`;
                    this.btn.style.top  = `${this._measure.top}px`;
                    this.btn.style.display = '';
                }
            });
        }

        destroy() {
            this.scroller.removeEventListener('scroll', this._onScroll);
            this.btn.remove();
        }
    });
}

const mainEditorExtensions = [
    basicSetup,
    javascript(),
    oneDark,
    EditorView.lineWrapping,
    selectionScreenshotButton(resultContainer),
];

const view = new EditorView({
    state: EditorState.create({
        doc: initialCode,
        extensions: mainEditorExtensions,
    }),
    parent: editorParent,
});

screenshotBtn.addEventListener('click', () => {
    takeScreenshot(view, resultContainer, screenshotBtn);
});
