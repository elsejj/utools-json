import * as monaco from "monaco-editor";
import { StringToJSON } from "@/utils/toJson";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import { loadSetting } from "@/composables/useEditorSetting";
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
// import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") {
      return new jsonWorker();
    }
    return new editorWorker();
  },
};

monaco.editor.addKeybindingRules([
  {
    keybinding: monaco.KeyMod.Alt | monaco.KeyCode.Equal,
    command: "editor.action.fontZoomIn",
    when: "editorTextFocus",
  },
  {
    keybinding: monaco.KeyMod.Alt | monaco.KeyCode.Minus,
    command: "editor.action.fontZoomOut",
    when: "editorTextFocus",
  },
  {
    keybinding: monaco.KeyMod.Alt | monaco.KeyCode.Digit0,
    command: "editor.action.fontZoomReset",
    when: "editorTextFocus",
  },
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
  selectionRanges: true,
});

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  allowComments: true,
  schemas: [],
  enableSchemaRequest: false,
  schemaRequest: "warning",
  schemaValidation: "warning",
  comments: "warning",
  trailingCommas: "error",
});

monaco.languages.registerDocumentFormattingEditProvider("json", {
  provideDocumentFormattingEdits(model) {
    const settings = loadSetting();
    const formatted = new StringToJSON(settings.sortKey).toJSON(
      model.getValue()
    );
    navigator.clipboard.writeText(formatted);
    return [
      {
        range: model.getFullModelRange(),
        text: formatted,
      },
    ];
  },
});

monaco.languages.registerDocumentRangeFormattingEditProvider("json", {
  provideDocumentRangeFormattingEdits(model, range) {
    const settings = loadSetting();
    const formatted = new StringToJSON(settings.sortKey).toJSON(
      model.getValueInRange(range)
    );
    navigator.clipboard.writeText(formatted);
    return [
      {
        range: range,
        text: formatted,
      },
    ];
  },
  provideDocumentRangesFormattingEdits(model, ranges, options, token) {
    const settings = loadSetting();
    return ranges.map((range) => {
      return {
        range: range,
        text: new StringToJSON(settings.sortKey).toJSON(
          model.getValueInRange(range)
        ),
      };
    });
  },
});

function tryTimestamp(value: string | undefined): string[] | null {
  if (!value) {
    return null;
  }
  const timestampRe = /^\d{9,}$/;
  if (timestampRe.test(value)) {
    const len = value.length;
    let date: Date | null = null;
    if (len < 11) {
      // seconds
      date = new Date(parseInt(value, 10) * 1000);
    } else if (len < 14) {
      // milliseconds
      date = new Date(parseInt(value, 10));
    } else if (len < 17) {
      // microseconds
      date = new Date(Math.floor(parseInt(value, 10) / 1000));
    } else {
      // nanoseconds
      date = new Date(Math.floor(parseInt(value, 10) / 1000000));
    }
    if (date) {
      const options: Intl.DateTimeFormatOptions = {
        dateStyle: "full",
        timeStyle: "full",
      };
      return [
        `- 本地时间: ${date.toLocaleString(undefined, options)}`,
        `- UTC时间: ${date.toLocaleString("UTC", {
          ...options,
          timeZone: "UTC",
        })}`,
      ];
    }
  }
  return null;
}

function tryMarkdown(line: string | undefined): string[] | null {
  if (!line) {
    return null;
  }
  // if current line contain \n or ", render as markdown
  if (line.indexOf("\\n") >= 0 || line.indexOf('\\"') >= 0) {
    if (line.endsWith(",")) {
      line = line.slice(0, -1);
    }
    const obj = JSON.parse(`{${line}}`);
    let markdown = "";
    if (typeof obj === "object") {
      for (const value of Object.values(obj)) {
        markdown += value;
      }
    } else if (typeof obj === "string") {
      markdown = obj;
    }
    if (markdown.length > 0) {
      return ["```\n" + markdown + "\n```"];
    }
  }
  return null;
}

monaco.languages.registerHoverProvider("json", {
  provideHover(model, position, token, context) {
    const word = model.getWordAtPosition(position);
    // try to parse as timestamp
    let lines = tryTimestamp(word?.word);
    if (lines === null) {
      // try to parse as markdown
      lines = tryMarkdown(model.getLineContent(position.lineNumber));
    }
    if (lines?.length) {
      return {
        range: new monaco.Range(
          position.lineNumber,
          word?.startColumn || position.column,
          position.lineNumber,
          word?.endColumn || position.column
        ),
        contents: lines.map((value) => ({ value })),
      };
    }
    return null;
  },
});
