import * as monaco from 'monaco-editor';
import { StringToJSON } from '@/utils/toJson';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import { loadSetting } from '@/composables/useEditorSetting';
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
// import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';



// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new jsonWorker();
    }
    return new editorWorker();
  }
};


monaco.editor.addKeybindingRules([
  {
    keybinding: monaco.KeyMod.Alt | monaco.KeyCode.Equal,
    command: 'editor.action.fontZoomIn',
    when: 'editorTextFocus'
  },
  {
    keybinding: monaco.KeyMod.Alt | monaco.KeyCode.Minus,
    command: 'editor.action.fontZoomOut',
    when: 'editorTextFocus'
  },
  {
    keybinding: monaco.KeyMod.Alt | monaco.KeyCode.Digit0,
    command: 'editor.action.fontZoomReset',
    when: 'editorTextFocus'
  }
]);

monaco.languages.json.jsonDefaults.setModeConfiguration({
  documentFormattingEdits: false,
  documentRangeFormattingEdits: false,
  completionItems: true,
  hovers: true,
  documentSymbols: true,
  tokens: true,
  colors: true,
  foldingRanges: true,
  diagnostics: true,
  selectionRanges: true
})

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  allowComments: true,
  schemas: [],
  enableSchemaRequest: false,
  schemaRequest: 'warning',
  schemaValidation: 'warning',
  comments: 'warning',
  trailingCommas: 'error'
})

monaco.languages.registerDocumentFormattingEditProvider('json', {
  provideDocumentFormattingEdits(model) {
    const settings = loadSetting();
    const formatted = new StringToJSON(settings.sortKey).toJSON(model.getValue());
    navigator.clipboard.writeText(formatted);
    return [
      {
        range: model.getFullModelRange(),
        text: formatted
      }
    ]
  }
});

monaco.languages.registerDocumentRangeFormattingEditProvider('json', {
  provideDocumentRangeFormattingEdits(model, range) {
    const settings = loadSetting();
    const formatted = new StringToJSON(settings.sortKey).toJSON(model.getValueInRange(range));
    navigator.clipboard.writeText(formatted);
    return [
      {
        range: range,
        text: formatted
      }
    ]
  },
  provideDocumentRangesFormattingEdits(model, ranges, options, token) {
    const settings = loadSetting();
    return ranges.map(range => {
      return {
        range: range,
        text: new StringToJSON(settings.sortKey).toJSON(model.getValueInRange(range))
      }
    });
  },
});


// monaco.languages.registerHoverProvider('json', {
//   provideHover(model, position) {
//     const word = model.getWordAtPosition(position);
//     console.log('word', word, position);
//     if (!word) {
//       return null;
//     }
//     const value = model.getValueInRange({
//       startLineNumber: position.lineNumber,
//       startColumn: word.startColumn,
//       endLineNumber: position.lineNumber,
//       endColumn: word.endColumn
//     });
//     try {
//       const json = new StringToJSON().toJSON(value);
//       return {
//         range: {
//           startLineNumber: position.lineNumber,
//           startColumn: word.startColumn,
//           endLineNumber: position.lineNumber,
//           endColumn: word.endColumn
//         },
//         contents: [
//           { value: `\`\`\`json\n${json}\n\`\`\`` }
//         ]
//       };
//     } catch (e) {
//       return null;
//     }
//   }
// });