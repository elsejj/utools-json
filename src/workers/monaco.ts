import * as monaco from 'monaco-editor';
import { StringToJSON } from '@/utils/toJson';

// // @ts-ignore
// import jsonURL from 'monaco-editor/esm/vs/language/json/json.worker?url';
// // @ts-ignore
// import editURL from 'monaco-editor/esm/vs/editor/editor.worker?url';

// self.MonacoEnvironment = {
//   getWorker(workId: any, label: string) {
//     console.log('Creating Monaco worker for label:', label, workId);
//     try {
//       if (label === 'json') {
//         return new Worker(jsonURL, { type: 'module' });
//       }
//       return new Worker(editURL, { type: 'module' });
//     } catch (error) {
//       console.error('Error creating Monaco worker:', error);
//       throw error;
//     }
//   }
// };

self.MonacoEnvironment = {
  getWorker: function (_workerId, label) {
    const getWorkerModule = (moduleUrl: string, label: string) => {
      //@ts-ignore
      return new Worker(self.MonacoEnvironment.getWorkerUrl(moduleUrl), {
        name: label,
        type: 'module'
      });
    };

    switch (label) {
      case 'json':
        return getWorkerModule('/monaco-editor/esm/vs/language/json/json.worker?worker', label);
      case 'css':
      case 'scss':
      case 'less':
        return getWorkerModule('/monaco-editor/esm/vs/language/css/css.worker?worker', label);
      case 'html':
      case 'handlebars':
      case 'razor':
        return getWorkerModule('/monaco-editor/esm/vs/language/html/html.worker?worker', label);
      case 'typescript':
      case 'javascript':
        return getWorkerModule('/monaco-editor/esm/vs/language/typescript/ts.worker?worker', label);
      default:
        return getWorkerModule('/monaco-editor/esm/vs/editor/editor.worker?worker', label);
    }
  }
};

// self.MonacoEnvironment = {
//   getWorkerUrl(_moduleId, label) {
//     if (label === 'json') {
//       return new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url).toString();
//     }
//     return new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url).toString();
//   }
// }


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