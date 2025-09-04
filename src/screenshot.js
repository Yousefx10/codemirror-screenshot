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


}