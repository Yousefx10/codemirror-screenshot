//important IMPORTS
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from "codemirror";
import * as htmlToImage from 'html-to-image';


// A minimal set of extensions for the temporary screenshot editor.
const screenshotExtensions = [
    basicSetup,
    javascript(),
    oneDark,
    EditorView.lineWrapping,
];


export async function takeScreenshot(view, resultContainer, screenshotBtn) {




    screenshotBtn.disabled = true;
    screenshotBtn.textContent = 'Generating...';
    resultContainer.innerHTML = '<p>Processing your image...</p>';

    const selection = view.state.selection.main;
    if (selection.empty) {
        resultContainer.innerHTML = '<p>Please select some code first.</p>';
        screenshotBtn.disabled = false;
        screenshotBtn.textContent = 'Take Screenshot';
        return;
    }





    const selectedText = view.state.doc.sliceString(selection.from, selection.to);

    const tempEditorContainer = document.createElement('div');
    tempEditorContainer.style.position = 'absolute';
    tempEditorContainer.style.top = '0';
    tempEditorContainer.style.left = '-9999px';
    tempEditorContainer.style.width = `${view.dom.clientWidth}px`;
    document.body.appendChild(tempEditorContainer);

    let tempView;





    try {
        tempView = new EditorView({
            state: EditorState.create({
                doc: selectedText,
                extensions: screenshotExtensions,
            }),
            parent: tempEditorContainer,
        });

        /*
        Give the browser a brief moment to render the new view.
        This is crucial...
        to ensure all styles are applied before the screenshot is taken.
        */

        await new Promise(resolve => setTimeout(resolve, 50));

        const editorBgColor = getComputedStyle(view.dom).backgroundColor;

        const dataUrl = await htmlToImage.toPng(tempView.dom, {
            backgroundColor: editorBgColor,
            pixelRatio: 2, // Generate a higher-resolution image
        });

        const img = new Image();
        img.src = dataUrl;
        resultContainer.innerHTML = '';
        resultContainer.appendChild(img);

    }
    catch (error) {
        console.error('Oops, something went wrong!', error);
        resultContainer.innerHTML = '<p>Sorry, there was an error generating the image.</p>';
    }
    finally {
        // IMPORTANT: Clean up the temporary editor and its container to prevent memory leaks
        if (tempView) {
            tempView.destroy();
        }
        document.body.removeChild(tempEditorContainer);
        screenshotBtn.disabled = false;
        screenshotBtn.textContent = 'Take Screenshot';
    }
}