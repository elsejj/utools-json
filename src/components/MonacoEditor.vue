<template>
  <div ref="monacoNode" class="h-full w-full"></div>
</template>


<script setup lang="ts">
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { onMounted, onUpdated, useTemplateRef } from 'vue';


const props = defineProps<{
  sourceCode: string
}>();
const monacoNode = useTemplateRef<HTMLDivElement>('monacoNode');
let editor: monaco.editor.IStandaloneCodeEditor | null = null;


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
  })

onMounted(() => {
  if (monacoNode.value) {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    editor = monaco.editor.create(monacoNode.value, {
      value: props.sourceCode || '',
      language: 'json',
      automaticLayout: true,
      placeholder: 'Enter JSON here...',
      formatOnPaste: true,
      theme: isDark ? 'vs-dark' : 'vs',
    });

    editor.onDidPaste((_e) => {
      setTimeout(() => {
        //console.log('Triggering format after paste');
        editor?.trigger('editor', 'editor.action.formatDocument', {});
      }, 100);
    })

  }
});

onUpdated(() => {
  console.log('Editor updated, checking for content change');
  if (editor && props.sourceCode !== editor.getValue()) {
    editor.setValue(props.sourceCode);
  }
});

function triggerEditorAction(action: string, payload: any = {}) {
  editor?.trigger('editor', action, payload);
}

function getText() {
  return editor?.getValue() || '';
}


defineExpose({
  triggerEditorAction,
  getText
});

</script>