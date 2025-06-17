<template>
  <div class="w-full h-full flex flex-col">
    <main class="flex-auto">
      <MonacoEditor ref="editor" :source-code="sourceCode" />
    </main>
    <footer>
      <div class="flex-none h-12 flex items-center justify-between w-full bg-gray-200 gap-1 p-1">
        <Button id="pasteReplace" icon="icon-[tabler--help]" as="a" link v-tooltip.top="'JSON Path 文档'"
          href="https://github.com/JSONPath-Plus/JSONPath" target="_blank" />
        <input class="flex-auto px-2 py-1 border border-gray-300 bg-white rounded" type="text" placeholder="$.<key>"
          v-model="jsonPathFilter" @change="filterJson" @input="filterJson" />
        <Button id="pasteReplace" icon="icon-[fluent-mdl2--paste-as-code]" rounded v-tooltip.top="'替换复制'"
          @click="pasteReplace" />
        <Button id="formatJSON" icon="icon-[tabler--braces] w-6 h-6" rounded v-tooltip.top="'格式化'"
          @click="triggerEditorAction('editor.action.formatDocument')" />
        <Button id="collapseAll" icon="icon-[tabler--arrows-diagonal-minimize]" rounded v-tooltip.top="'折叠所有'"
          @click="triggerEditorAction('editor.foldAll')" />
        <Button id="expandAll" icon="icon-[tabler--arrows-move-vertical]" rounded v-tooltip.top="'展开所有'"
          @click="triggerEditorAction('editor.unfoldAll')" />
        <SplitButton id="copyJSON" icon="icon-[fluent-mdl2--copy]" rounded :model="copyActions" v-tooltip.top="'复制'"
          @click="copyJSON()" />
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { JSONPath } from 'jsonpath-plus';
import MonacoEditor from './components/MonacoEditor.vue';
import { base64FromJson, htmlNestedFromJson, htmlPlainFromJson, javaScriptFromJson, jsonFromJson, oneLineFromJson, quotedMultiLineFromJson, quotedOneLineFromJson } from './utils/fromJson';
import { StringToJSON } from './utils/toJson';
import './workers/monaco'

import { ref } from 'vue';
import { RefSymbol } from '@vue/reactivity';

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
  }
]

const sourceCode = ref(`{
  "name": "example",
  "version": "1.0.0",
  "description": "An example JSON file",
  "author": "Your Name",
  "license": "MIT"
}`); // Default JSON content

// in filter mode, this is the original source code
const originalSourceCode = ref('')
const jsonPathFilter = ref(''); // JSON Path filter input


const editor = ref<InstanceType<typeof MonacoEditor> | null>(null);


function triggerEditorAction(action: string, payload: any = {}) {
  if (editor.value) {
    editor.value.triggerEditorAction(action, payload);
  }
}

async function pasteReplace() {
  const text = await navigator.clipboard.readText()
  if (!text) {
    return;
  }
  const jsonBody = new StringToJSON().toJSON(text)
  sourceCode.value = jsonBody;
}

async function copyJSON(processor?: (text: string) => string, mimetype?: string): Promise<string> {
  const text = editor.value?.getText() || '';
  if (!text) {
    return '';
  }
  try {
    const processedText = processor ? processor(text) : text;
    if (mimetype) {
      await navigator.clipboard.write([
        new ClipboardItem({
          [mimetype]: processedText,
        })
      ]);
    } else {
      await navigator.clipboard.writeText(processedText);
    }
    console.log('Copied JSON to clipboard:', processedText);
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
    originalSourceCode.value = editor.value?.getText() || '';
  }

  try {
    const result = JSONPath({
      path: jsonPathFilter.value.trim(),
      json: JSON.parse(originalSourceCode.value)
    })
    console.log('JSONPath result:', result);
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

</script>
