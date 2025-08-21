<template>
  <div class="w-full h-full flex flex-col">
    <main class="flex-auto">
      <MonacoDiffEditor v-if="diffMode" ref="editor" v-model="sourceCode" />
      <MonacoEditor v-else ref="editor" v-model="sourceCode" />
    </main>
    <footer>
      <div class="flex-none h-12 flex items-center justify-between w-full gap-1 p-2">
        <Button id="pasteReplace" icon="icon-[tabler--help]" as="a" link v-tooltip.top="'JSON Path 文档'"
          href="https://github.com/JSONPath-Plus/JSONPath" target="_blank"
          @click="openURL('https://github.com/JSONPath-Plus/JSONPath')" />
        <InputText class="flex-auto px-2 py-1 border rounded" type="text" placeholder="$.<key>" v-model="jsonPathFilter"
          @change="filterJson" @input="filterJson" />
        <Button id="pasteReplace" icon="icon-[fluent-mdl2--paste-as-code]" rounded
          v-tooltip.top="'替换复制\n(Ctrl+Shift+V)'" @click="pasteReplace" />
        <Button id="formatJSON" icon="icon-[tabler--braces] w-6 h-6" rounded v-tooltip.top="'格式化\n(Shift+Alt+F)'"
          @click="triggerEditorAction('editor.action.formatDocument')" />
        <Button id="collapseAll" icon="icon-[tabler--arrows-diagonal-minimize]" rounded
          v-tooltip.top="'折叠所有\n(Ctrl+K Ctrl+0)'" @click="triggerEditorAction('editor.foldAll')" />
        <Button id="expandAll" icon="icon-[tabler--arrows-move-vertical]" rounded
          v-tooltip.top="'展开所有\n(Ctrl+K Ctrl+J)'" @click="triggerEditorAction('editor.unfoldAll')" />
        <SplitButton id="copyJSON" icon="icon-[fluent-mdl2--copy]" rounded :model="copyActions"
          v-tooltip.top="'复制\n(Ctrl+C)'" @click="copyJSON()" />
        <Button id="toggleDiff" icon="icon-[tabler--arrows-diff]" rounded v-tooltip.top="'切换对比模式'"
          @click="toggleDiffMode" />
        <Button id="editorSetting" icon="icon-[tabler--settings]" rounded v-tooltip.top="'编辑器设置'"
          @click="showSettingPanel($event)" />
        <Popover ref="settingPanel">
          <EditorSetting />
        </Popover>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { JSONPath } from 'jsonpath-plus';
import MonacoEditor from './MonacoEditor.vue';
import MonacoDiffEditor from './MonacoDiffEditor.vue';
import EditorSetting from './EditorSetting.vue';
import { base64FromJson, htmlNestedFromJson, htmlPlainFromJson, javaScriptFromJson, jsonFromJson, oneLineFromJson, quotedMultiLineFromJson, quotedOneLineFromJson, yamlFromJson } from '../utils/fromJson';
import { StringToJSON } from '../utils/toJson';
import '../workers/monaco'

import { ref, watch } from 'vue';
import { Popover } from 'primevue';

interface IMonacoEditor {
  triggerEditorAction(action: string, payload?: any): void;
  setSourceCode(code: string): void;
}

// const props = defineProps<{ modelValue?: string }>();
// const emit = defineEmits(['update:modelValue']);
// const sourceCode = ref(props.modelValue || '');

const sourceCode = defineModel<string>({
  type: String,
  default: ''
});

const diffMode = ref(false);
const editor = ref<IMonacoEditor | null>(null);
const originalSourceCode = ref('');
const jsonPathFilter = ref('');
const settingPanel = ref();

// watch(sourceCode, (newValue) => {
//   console.log(`sourceCode changed: ${newValue}`);
// });

// watch(sourceCode, (v) => {
//   emit('update:modelValue', v || '');
// });



const copyActions = [
  { label: '单行', icon: 'icon-[tabler--separator-horizontal]', command: () => copyJSON(oneLineFromJson) },
  { label: '转义字符串(多行)', icon: 'icon-[tabler--blockquote]', command: () => copyJSON(quotedMultiLineFromJson) },
  { label: '转义字符串(单行)', icon: 'icon-[tabler--quote]', command: () => copyJSON(quotedOneLineFromJson) },
  { label: 'Base64', icon: 'icon-[tabler--a-b]', command: () => copyJSON(base64FromJson) },
  { label: 'YAML', icon: 'icon-[devicon-plain--yaml]', command: () => copyJSON(yamlFromJson) },
  { label: 'Javascript', icon: 'icon-[tabler--brand-javascript]', command: () => copyJSON(javaScriptFromJson) },
  { label: 'Python', icon: 'icon-[tabler--brand-python]', command: () => copyJSON() },
  { label: 'Rust', icon: 'icon-[tabler--brand-rust]', command: () => copyJSON((text: string) => `json!(${jsonFromJson(text)})`) },
  { label: 'Go', icon: 'icon-[tabler--brand-golang]', command: async () => copyJSON((text: string) => "`" + jsonFromJson(text) + "`") },
  { label: 'C/C++', icon: 'icon-[tabler--brand-cpp]', command: () => copyJSON((text: string) => text.split('\n').map(line => JSON.stringify(line)).join("\n") + ";") },
  { label: 'Excel(单表头)', icon: 'icon-[tabler--file-spreadsheet]', command: () => copyJSON(htmlPlainFromJson, 'text/html') },
  { label: 'Excel(多级表头)', icon: 'icon-[tabler--file-spreadsheet]', command: () => copyJSON(htmlNestedFromJson, 'text/html') },
  { label: '更多格式', icon: 'icon-[tabler--dots]', command: () => { if ((window as any).utools) { (window as any).utools.shellOpenExternal('https://app.quicktype.io/') } else { window.open('https://app.quicktype.io/', '_blank'); } } }
];

function triggerEditorAction(action: string, payload: any = {}) {
  if (editor.value) {
    editor.value.triggerEditorAction(action, payload);
  }
}

function showSettingPanel(event: Event) {
  settingPanel.value.toggle(event);
}

async function pasteReplace() {
  const text = await navigator.clipboard.readText()
  if (!text) return;
  const jsonBody = new StringToJSON().toJSON(text)
  sourceCode.value = jsonBody;
  await navigator.clipboard.writeText(jsonBody);
}

async function copyJSON(processor?: (text: string) => string, _mimetype?: string): Promise<string> {
  const text = sourceCode.value || ''
  if (!text) return '';
  try {
    const processedText = processor ? processor(text) : text;
    await navigator.clipboard.writeText(processedText);
    return processedText;
  } catch (err) {
    console.error('Failed to copy JSON:', err);
    return '';
  }
}

function noEmptyValue(val: any): boolean {
  if (val) {
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    return true;
  }
  return false;
}

function filterJson() {
  if (!jsonPathFilter.value) {
    sourceCode.value = originalSourceCode.value;
    originalSourceCode.value = '';
    return;
  }
  if (!originalSourceCode.value) originalSourceCode.value = sourceCode.value || '';
  try {
    const result = JSONPath({ path: jsonPathFilter.value.trim(), json: JSON.parse(originalSourceCode.value) })
    if (noEmptyValue(result)) sourceCode.value = JSON.stringify(result, null, 2);
    else sourceCode.value = originalSourceCode.value;
  } catch (err) {
    console.error('JSONPath error:', err);
    sourceCode.value = originalSourceCode.value;
  }
}

function openURL(url: string) {
  if ((window as any).utools) (window as any).utools.shellOpenExternal(url);
}

function toggleDiffMode() { diffMode.value = !diffMode.value; }

defineExpose({
  triggerEditorAction,
  setSourceCode(code: string) {
    sourceCode.value = code;
    if (editor.value) editor.value.setSourceCode(code);
  }
});

</script>
