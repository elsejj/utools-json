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
const monacoNode = useTemplateRef<HTMLDivElement>('monacoNode');
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let editorChangeListener: monaco.IDisposable | null = null;
const mediaQueryAborter = new AbortController();
const sourceCode = defineModel({
  type: String,
  default: ''
});



onMounted(() => {
  if (monacoNode.value) {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const fontSize = parseInt(localStorage.getItem('monaco-font-size') || '13', 10);

    editor = monaco.editor.create(monacoNode.value, {
      value: sourceCode.value || '',
      language: 'json',
      automaticLayout: true,
      placeholder: 'Enter JSON here...',
      formatOnPaste: true,
      theme: isDark ? 'vs-dark' : 'vs',
      fontSize,
      mouseWheelZoom: true,
      wordWrap: 'on'
    });


    editor.onDidChangeModelContent(() => {
      const value = editor?.getValue() || '';
      if (value) {
        sourceCode.value = value;
      }
    });

    editor.onDidPaste((_e) => {
      setTimeout(() => {
        //console.log('Triggering format after paste');
        editor?.trigger('editor', 'editor.action.formatDocument', {});
      }, 100);
    })


    editorChangeListener = editor.onDidChangeConfiguration(() => {
      const fontSize = editor?.getOption(monaco.editor.EditorOption.fontSize);
      if (fontSize) {
        localStorage.setItem('monaco-font-size', Math.round(fontSize).toString());
      }
    });


    editor.addAction({
      id: "json-utools-paste-replace",
      label: "Replace Paste",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyV],
      run: async () => {
        const text = await navigator.clipboard.readText()
        if (!text) {
          return;
        }
        const jsonBody = new StringToJSON().toJSON(text)
        editor?.setValue(jsonBody || text);
        await navigator.clipboard.writeText(jsonBody);
      }
    });


    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', ({ matches }) => {
        if (matches) {
          if (editor) {
            monaco.editor.setTheme('vs-dark');
          }
        } else {
          if (editor) {
            monaco.editor.setTheme('vs');
          }
        }
      }, { signal: mediaQueryAborter.signal });
  }
});


onUnmounted(() => {
  if (editor) {
    editorChangeListener?.dispose();
    editor.trigger('editor', 'editor.action.fontZoomReset', {});
    editor.dispose();
    editor = null;
  }
  mediaQueryAborter.abort();
});

function triggerEditorAction(action: string, payload: any = {}) {
  editor?.trigger('editor', action, payload);
}

defineExpose({
  triggerEditorAction,
});

</script>