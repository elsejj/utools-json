<template>
  <div ref="monacoNode" class="h-full w-full"></div>
</template>


<script setup lang="ts">
import { StringToJSON } from '@/utils/toJson';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { onMounted, onUnmounted, watch, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia'
import { useEditorSetting } from '@/composables/useEditorSetting'


const monacoNode = useTemplateRef<HTMLDivElement>('monacoNode');
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
const mediaQueryAborter = new AbortController();
const sourceCode = defineModel({
  type: String,
  default: ''
});

// 获取编辑器设置
const editorSettingStore = useEditorSetting()
const { setting } = storeToRefs(editorSettingStore)

onMounted(() => {
  if (monacoNode.value) {
    // 主题优先用设置，否则跟随系统
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = setting.value.theme || (isDark ? 'vs-dark' : 'vs')
    const fontSize = setting.value.fontSize || 14
    const fontFamily = setting.value.fontFamily || ''

    editor = monaco.editor.create(monacoNode.value, {
      value: sourceCode.value || '',
      language: 'json',
      automaticLayout: true,
      placeholder: 'Enter JSON here...',
      formatOnPaste: true,
      theme,
      fontSize,
      fontFamily,
      mouseWheelZoom: true,
      wordWrap: 'on',
      tabSize: 2,
    });


    editor.onDidChangeModelContent(() => {
      const value = editor?.getValue() || '';
      if (value) {
        sourceCode.value = value;
      }
    });

    editor.onDidPaste((_e) => {
      setTimeout(() => {
        editor?.trigger('editor', 'editor.action.formatDocument', {});
      }, 100);
    })

    editor.addAction({
      id: "json-utools-paste-replace",
      label: "Replace Paste",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyV],
      run: async () => {
        const text = await navigator.clipboard.readText()
        if (!text) {
          return;
        }
        const jsonBody = new StringToJSON(setting.value.sortKey).toJSON(text)
        editor?.setValue(jsonBody || text);
        await navigator.clipboard.writeText(jsonBody);
      }
    });


    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', ({ matches }) => {
        if (!setting.value.theme) {
          monaco.editor.setTheme(matches ? 'vs-dark' : 'vs');
        }
      }, { signal: mediaQueryAborter.signal });
  }
});

// 响应设置变化，动态更新编辑器
watch(() => setting.value.fontSize, val => {
  if (editor && val) editor.updateOptions({ fontSize: val });
});
watch(() => setting.value.fontFamily, val => {
  if (editor && val) editor.updateOptions({ fontFamily: val });
});
watch(() => setting.value.theme, val => {
  if (editor && val) monaco.editor.setTheme(val);
});

onUnmounted(() => {
  if (editor) {
    editor.dispose();
    editor = null;
  }
  mediaQueryAborter.abort();
});

function triggerEditorAction(action: string, payload: any = {}) {
  editor?.trigger('editor', action, payload);
}

function setSourceCode(code: string) {
  if (editor) {
    sourceCode.value = code;
    editor.setValue(code);
    editor.focus();
  }
}

defineExpose({
  triggerEditorAction,
  setSourceCode,
});

</script>