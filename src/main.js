// Required imports
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from "codemirror";

import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

import { takeScreenshot } from './screenshot.js';



const initialCode = `// Welcome to the CodeMirror 6 Screenshot Tool!
// 1. Select a block of code you want to capture.
// 2. Click the "Take Screenshot" button.
// 3. The generated image will appear below.

function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(\`Fibonacci(10) is \${result}\`);

class Greeter {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return \`Hello, \${this.name}!\`;
  }
}
`;