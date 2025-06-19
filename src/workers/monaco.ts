import * as monaco from 'monaco-editor';
import { StringToJSON } from '@/utils/toJson';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
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
    return [
      {
        range: model.getFullModelRange(),
        text: new StringToJSON().toJSON(model.getValue())
      }
    ]
  }
});

monaco.languages.registerDocumentRangeFormattingEditProvider('json', {
  provideDocumentRangeFormattingEdits(model, range) {
    return [
      {
        range: range,
        text: new StringToJSON().toJSON(model.getValueInRange(range))
      }
    ]
  },
  provideDocumentRangesFormattingEdits(model, ranges, options, token) {
    return ranges.map(range => {
      return {
        range: range,
        text: new StringToJSON().toJSON(model.getValueInRange(range))
      }
    });
  },
});