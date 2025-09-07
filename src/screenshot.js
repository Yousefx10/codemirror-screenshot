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

export async function takeScreenshot(view, resultContainer, screenshotBtn) {
    if (screenshotBtn) {
        screenshotBtn.disabled = true;
        screenshotBtn.textContent = 'Capturing...';
    }

    const currentWidth = Math.ceil(view.dom.getBoundingClientRect().width);
    if (FORCE_SCREENSHOT_WIDTH_PX != null) {
        INITIAL_EDITOR_WIDTH_PX = FORCE_SCREENSHOT_WIDTH_PX;
    } else if (INITIAL_EDITOR_WIDTH_PX == null) {
        INITIAL_EDITOR_WIDTH_PX = currentWidth;
    }
    const TARGET_WIDTH = INITIAL_EDITOR_WIDTH_PX;

    const sel = view.state.selection.main;
    const selectedText =
        sel && !sel.empty
            ? view.state.sliceDoc(sel.from, sel.to)
            : view.state.doc.toString();

    const tempEditorContainer = document.createElement('div');
    tempEditorContainer.style.position = 'fixed';
    tempEditorContainer.style.top = '0';
    tempEditorContainer.style.left = '0';
    tempEditorContainer.style.opacity = '0';
    tempEditorContainer.style.pointerEvents = 'none';
    tempEditorContainer.style.width = `${TARGET_WIDTH}px`;
    tempEditorContainer.style.maxHeight = 'none';
    tempEditorContainer.style.overflow = 'visible';
    tempEditorContainer.style.contain = 'layout paint size';
    document.body.appendChild(tempEditorContainer);

    let tempView = null;

    try {
        tempView = new EditorView({
            state: EditorState.create({
                doc: selectedText,
                extensions: screenshotExtensions,
            }),
            parent: tempEditorContainer,
        });

        await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
        );

        void tempView.dom.getBoundingClientRect();

        const exportWidth = TARGET_WIDTH;
        const exportHeight = Math.ceil(tempView.dom.scrollHeight);

        //export HTML-TO-IMAGE with pixelRatio value
        const dataUrl = await htmlToImage.toPng(tempView.dom, {
            pixelRatio: FIXED_PIXEL_RATIO,
            width: exportWidth,
            height: exportHeight,
            // backgroundColor: '#0b0e14', //if needed a fixed backgroundColor
            // skipFonts: false,  //MAKES SURE TO LOAD FONT'S IF IT WERE "WebFonts"
        });

        // Shows screenshot result:
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
            resultContainer.innerHTML =
                '<p>Sorry, there was an error generating the image.</p>';
        }
    } finally {
        if (tempView) tempView.destroy();
        tempEditorContainer.remove();

        if (screenshotBtn) {
            screenshotBtn.disabled = false;
            screenshotBtn.textContent = 'Take Screenshot';
        }
    }
}
