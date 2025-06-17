import * as monaco from 'monaco-editor';

// @ts-ignore
import jsonURL from 'monaco-editor/esm/vs/language/json/json.worker?url';
// @ts-ignore
import editURL from 'monaco-editor/esm/vs/editor/editor.worker?url';
import { StringToJSON } from '@/utils/toJson';

self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new Worker(jsonURL, { type: 'module' });
    }
    return new Worker(editURL, { type: 'module' });
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
    console.log('Formatting JSON document:', model.uri.toString());
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
    console.log('Formatting JSON range:', model.uri.toString(), range);
    return [
      {
        range: range,
        text: new StringToJSON().toJSON(model.getValueInRange(range))
      }
    ]
  },
  provideDocumentRangesFormattingEdits(model, ranges, options, token) {
    console.log('Formatting JSON ranges:', model.uri.toString(), ranges);
    return ranges.map(range => {
      return {
        range: range,
        text: new StringToJSON().toJSON(model.getValueInRange(range))
      }
    });
  },
});