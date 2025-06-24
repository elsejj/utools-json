<template>
  <div ref="monacoNode" class="h-full w-full"></div>
</template>


<script setup lang="ts">
import { StringToJSON } from '@/utils/toJson';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { onMounted, onUnmounted, useTemplateRef } from 'vue';


// const props = defineProps<{
//   sourceCode: string
// }>();

const sourceCode = defineModel({
  type: String,
  default: ''
});
const monacoNode = useTemplateRef<HTMLDivElement>('monacoNode');
let diffEditor: monaco.editor.IStandaloneDiffEditor | null = null;
const mediaQueryAborter = new AbortController();
let originalModel: monaco.editor.ITextModel | null = null;
let modifiedModel: monaco.editor.ITextModel | null = null;

let originalChangeListener: monaco.IDisposable | null = null;
let modifiedChangeListener: monaco.IDisposable | null = null;

function onDidPaste(_e: any) {
  // @ts-ignore
  const editor = this as monaco.editor.IStandaloneCodeEditor;
  setTimeout(() => {
    //console.log('Triggering format after paste');
    editor.trigger('editor', 'editor.action.formatDocument', {});
  }, 100);
}

async function replacePaste() {
  // @ts-ignore
  const editor = this as monaco.editor.IStandaloneCodeEditor;
  navigator.clipboard.readText().then(text => {
    if (!text) {
      return;
    }
    const jsonBody = new StringToJSON().toJSON(text);
    if (jsonBody) {
      editor?.setValue(jsonBody);
      navigator.clipboard.writeText(jsonBody);
    }
  });
}

function saveFontSize() {
  // @ts-ignore
  const editor = this as monaco.editor.IStandaloneCodeEditor;
  const fontSize = editor.getOption(monaco.editor.EditorOption.fontSize);
  localStorage.setItem('monaco-font-size', Math.round(fontSize).toString());
}

onMounted(() => {
  if (monacoNode.value) {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const fontSize = parseInt(localStorage.getItem('monaco-font-size') || '13', 10);

    originalModel = monaco.editor.createModel('', 'json');
    modifiedModel = monaco.editor.createModel(sourceCode.value || '', 'json');

    diffEditor = monaco.editor.createDiffEditor(monacoNode.value, {
      automaticLayout: true,
      theme: isDark ? 'vs-dark' : 'vs',
      wordWrap: 'on',
      originalEditable: true,
      fontSize,
      mouseWheelZoom: true,
    });


    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel
    });


    diffEditor.getModifiedEditor().onDidChangeModelContent(() => {
      const value = diffEditor?.getModifiedEditor().getValue() || '';
      if (value) {
        sourceCode.value = value;
      }
    });

    diffEditor.getOriginalEditor().onDidPaste(onDidPaste.bind(diffEditor.getOriginalEditor()));
    diffEditor.getModifiedEditor().onDidPaste(onDidPaste.bind(diffEditor.getModifiedEditor()));

    originalChangeListener = diffEditor.getOriginalEditor().onDidChangeConfiguration(saveFontSize.bind(diffEditor.getOriginalEditor()));
    modifiedChangeListener = diffEditor.getModifiedEditor().onDidChangeConfiguration(saveFontSize.bind(diffEditor.getModifiedEditor()));

    diffEditor.getOriginalEditor().addAction({
      id: "json-utools-paste-replace",
      label: "Replace Paste",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyV],
      run: replacePaste.bind(diffEditor.getOriginalEditor())
    });

    diffEditor.getModifiedEditor().addAction({
      id: "json-utools-paste-replace",
      label: "Replace Paste",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyV],
      run: replacePaste.bind(diffEditor.getModifiedEditor())
    });

    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', ({ matches }) => {
        if (matches) {
          if (diffEditor) {
            monaco.editor.setTheme('vs-dark');
          }
        } else {
          if (diffEditor) {
            monaco.editor.setTheme('vs');
          }
        }
      }, { signal: mediaQueryAborter.signal });
  }
});

// onUpdated(() => {
//   console.log('Editor updated, checking for content change', sourceCode.value);
//   if (diffEditor && sourceCode.value !== diffEditor.getOriginalEditor().getValue()) {
//     diffEditor.getModifiedEditor().setValue(sourceCode.value || '');
//   }
// });

onUnmounted(() => {
  if (diffEditor) {
    originalChangeListener?.dispose();
    modifiedChangeListener?.dispose();

    diffEditor.getOriginalEditor().trigger('editor', 'editor.action.fontZoomReset', {});
    diffEditor.getModifiedEditor().trigger('editor', 'editor.action.fontZoomReset', {});

    diffEditor.dispose();
    diffEditor = null;
  }
  mediaQueryAborter.abort();
});

function triggerEditorAction(action: string, payload: any = {}) {
  diffEditor?.getModifiedEditor().trigger('editor', action, payload);
}

defineExpose({
  triggerEditorAction,
});

</script>