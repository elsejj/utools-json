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
import MonacoEditor from './components/MonacoEditor.vue';
import MonacoDiffEditor from './components/MonacoDiffEditor.vue';
import EditorSetting from './components/EditorSetting.vue';
import { base64FromJson, htmlNestedFromJson, htmlPlainFromJson, javaScriptFromJson, jsonFromJson, oneLineFromJson, quotedMultiLineFromJson, quotedOneLineFromJson, yamlFromJson } from './utils/fromJson';
import { StringToJSON } from './utils/toJson';
import './workers/monaco'

import { ref } from 'vue';
import { Popover } from 'primevue';

interface IMonacoEditor {
  triggerEditorAction(action: string, payload?: any): void;
  setSourceCode(code: string): void;
}

const sourceCode = ref(``); // Default JSON content
const diffMode = ref(false); // Track if in diff mode
const editor = ref<IMonacoEditor | null>(null);
// in filter mode, this is the original source code
const originalSourceCode = ref('')
const jsonPathFilter = ref(''); // JSON Path filter input
const settingPanel = ref();

if (window.utools) {
  window.utools.onPluginEnter((action) => {
    if (typeof action.payload === 'string' && action.payload.length > 5) {
      try {
        sourceCode.value = new StringToJSON().toJSON(action.payload) || '';
        if (editor.value) {
          editor.value.setSourceCode(sourceCode.value);
        }
      } catch (error) {
        sourceCode.value = action.payload; // Fallback to raw payload if conversion fails
      }
    }
  });
}

const copyActions = [
  {
    label: '单行',
    icon: 'icon-[tabler--separator-horizontal]',
    command: () => copyJSON(oneLineFromJson),

  },
  {
    label: '转义字符串(多行)',
    icon: 'icon-[tabler--blockquote]',
    command: () => copyJSON(quotedMultiLineFromJson)
  },
  {
    label: '转义字符串(单行)',
    icon: 'icon-[tabler--quote]',
    command: () => copyJSON(quotedOneLineFromJson)
  },
  {
    label: 'Base64',
    icon: 'icon-[tabler--a-b]',
    command: () => copyJSON(base64FromJson)
  },
  {
    label: 'YAML',
    icon: 'icon-[devicon-plain--yaml]',
    command: () => copyJSON(yamlFromJson)
  },
  {
    label: 'Javascript',
    icon: 'icon-[tabler--brand-javascript]',
    command: () => copyJSON(javaScriptFromJson),
  },
  {
    label: 'Python',
    icon: 'icon-[tabler--brand-python]',
    command: () => copyJSON(),
  },
  {
    label: 'Rust',
    icon: 'icon-[tabler--brand-rust]',
    command: () => copyJSON((text) => {
      return `json!(${jsonFromJson(text)})`
    }
    )
  },
  {
    label: 'Go',
    icon: 'icon-[tabler--brand-golang]',
    command: async () => copyJSON((text) => {
      return "`" + jsonFromJson(text) + "`"
    })

  },
  {
    label: 'C/C++',
    icon: 'icon-[tabler--brand-cpp]',
    command: () => copyJSON((text) => {
      return text.split('\n')
        .map(line => JSON.stringify(line))
        .join("\n") + ";"
    })
  },
  {
    label: 'Excel(单表头)',
    icon: 'icon-[tabler--file-spreadsheet]',
    command: () => copyJSON(htmlPlainFromJson, 'text/html')
  },
  {
    label: 'Excel(多级表头)',
    icon: 'icon-[tabler--file-spreadsheet]',
    command: () => copyJSON(htmlNestedFromJson, 'text/html')
  },
  {
    label: '更多格式',
    icon: 'icon-[tabler--dots]',
    command: () => {
      if (window.utools) {
        window.utools.shellOpenExternal('https://app.quicktype.io/')
      } else {
        window.open('https://app.quicktype.io/', '_blank');
      }
    }
  }
]

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
  if (!text) {
    return;
  }
  const jsonBody = new StringToJSON().toJSON(text)
  sourceCode.value = jsonBody;

  // write formatted JSON back to clipboard
  await navigator.clipboard.writeText(jsonBody);
}

async function copyJSON(processor?: (text: string) => string, _mimetype?: string): Promise<string> {
  const text = sourceCode.value || ''
  if (!text) {
    return '';
  }
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
    if (Array.isArray(val)) {
      return val.length > 0;
    } else if (typeof val === 'object') {
      return Object.keys(val).length > 0;
    } else {
      return true; // For strings and other types, just check if they are truthy
    }
  }
  return false; // If the value is null, undefined, or empty, return false
}

function filterJson() {
  if (!jsonPathFilter.value) {
    sourceCode.value = originalSourceCode.value;
    // indicate that we are not in filter mode
    originalSourceCode.value = ''
    return;
  }
  if (!originalSourceCode.value) {
    // first time entering filter mode, save the original source code
    originalSourceCode.value = sourceCode.value || '';
  }

  try {
    const result = JSONPath({
      path: jsonPathFilter.value.trim(),
      json: JSON.parse(originalSourceCode.value)
    })
    //console.log('JSONPath result:', result);
    if (noEmptyValue(result)) {
      sourceCode.value = JSON.stringify(result, null, 2);
    } else {
      sourceCode.value = originalSourceCode.value;
    }
  }
  catch (err) {
    console.error('JSONPath error:', err);
    sourceCode.value = originalSourceCode.value
  }
}

function openURL(url: string) {
  if (window.utools) {
    window.utools.shellOpenExternal(url);
  }
}


function toggleDiffMode() {
  diffMode.value = !diffMode.value;
}


</script>
