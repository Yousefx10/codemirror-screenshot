import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import * as htmlToImage from 'html-to-image';

//=== THEME Settings ===

//Fix the value of pixelRatio to get same result when page get zoom in or out
const FIXED_PIXEL_RATIO = 1;
const FONT_SIZE_PX = 14;
const LINE_HEIGHT_PX = 21;
const FORCE_SCREENSHOT_WIDTH_PX = null;
let INITIAL_EDITOR_WIDTH_PX = null;

const screenshotExtensions = [
    basicSetup,
    javascript(),
    oneDark,
    EditorView.lineWrapping,
    EditorView.theme({
        ".cm-scroller": {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: `${FONT_SIZE_PX}px`,
            lineHeight: `${LINE_HEIGHT_PX}px`,
        },
        ".cm-gutter, .cm-lineNumbers, .cm-gutterElement": {
            fontFamily: "inherit",
            lineHeight: `${LINE_HEIGHT_PX}px`,
            fontSize: `${FONT_SIZE_PX}px`,
        },
    }),
];

function pickTargetWidth(view) {
    const currentWidth = Math.ceil(view.dom.getBoundingClientRect().width);
    if (FORCE_SCREENSHOT_WIDTH_PX != null) {
        INITIAL_EDITOR_WIDTH_PX = FORCE_SCREENSHOT_WIDTH_PX;
    } else if (INITIAL_EDITOR_WIDTH_PX == null) {
        INITIAL_EDITOR_WIDTH_PX = currentWidth;
    }
    return INITIAL_EDITOR_WIDTH_PX;
}

function getSelectedOrAll(view) {
    const sel = view.state.selection.main;
    return sel && !sel.empty
        ? view.state.sliceDoc(sel.from, sel.to)
        : view.state.doc.toString();
}

async function buildTempView(docText, widthPx) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    container.style.width = `${widthPx}px`;
    container.style.maxHeight = 'none';
    container.style.overflow = 'visible';
    container.style.contain = 'layout paint size';
    document.body.appendChild(container);

    const tempView = new EditorView({
        state: EditorState.create({
            doc: docText,
            extensions: screenshotExtensions,
        }),
        parent: container,
    });

    await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
    );
    void tempView.dom.getBoundingClientRect();

    return { tempView, container };
}

async function exportPNG(dom, width, height) {
    return htmlToImage.toPng(dom, {
        pixelRatio: FIXED_PIXEL_RATIO,
        width,
        height,
    });
}

async function exportSVG(dom, width, height) {
    return htmlToImage.toSvg(dom, {
        width,
        height,
    });
}

async function capture(view, format) {
    const TARGET_WIDTH = pickTargetWidth(view);
    const docText = getSelectedOrAll(view);
    const { tempView, container } = await buildTempView(docText, TARGET_WIDTH);
    try {
        const exportWidth = TARGET_WIDTH;
        const exportHeight = Math.ceil(tempView.dom.scrollHeight);
        const url =
            format === 'svg'
                ? await exportSVG(tempView.dom, exportWidth, exportHeight)
                : await exportPNG(tempView.dom, exportWidth, exportHeight);
        return url;
    } finally {
        tempView.destroy();
        container.remove();
    }
}

export async function takeScreenshot(view, resultContainer, screenshotBtn, opts = { format: 'png' }) {
    if (screenshotBtn) {
        screenshotBtn.disabled = true;
        screenshotBtn.textContent = 'Capturing...';
    }
    try {
        const dataUrl = await capture(view, opts.format === 'svg' ? 'svg' : 'png');
        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'Code screenshot';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        resultContainer.innerHTML = '';
        resultContainer.appendChild(img);
    } catch (err) {
        console.error('Screenshot error:', err);
        if (resultContainer) {
            resultContainer.innerHTML = '<p>Sorry, there was an error generating the image.</p>';
        }
    } finally {
        if (screenshotBtn) {
            screenshotBtn.disabled = false;
            screenshotBtn.textContent = 'Take Screenshot';
        }
    }
}

export async function takeScreenshotPNG(view, resultContainer, screenshotBtn) {
    return takeScreenshot(view, resultContainer, screenshotBtn, { format: 'png' });
}

export async function takeScreenshotSVG(view, resultContainer, screenshotBtn) {
    return takeScreenshot(view, resultContainer, screenshotBtn, { format: 'svg' });
}

export async function getScreenshotDataUrl(view, { format = 'png' } = {}) {
    return capture(view, format === 'svg' ? 'svg' : 'png');
}
