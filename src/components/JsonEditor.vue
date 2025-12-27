<template>
  <div class="w-full h-full flex flex-col">
    <main class="flex-auto">
      <MonacoDiffEditor v-if="diffMode" ref="editor" v-model="sourceCode" />
      <div v-else-if="showSplitView" class="flex flex-row h-full w-full gap-1">
        <MonacoEditor ref="editor" v-model="sourceCode" class="flex-1 min-w-0" />
        <div class="flex-1 min-w-0 relative flex flex-col">
          <div class="absolute top-2 right-4 z-10 flex gap-1">
             <Button
              icon="icon-[tabler--external-link]"
              rounded
              text
              severity="secondary" 
              class="bg-surface-0! dark:bg-surface-900! shadow-sm border border-surface-200 dark:border-surface-700" 
              v-tooltip.left="'在新标签页打开结果'"
              @click="openFilteredInNewTab"
            />
          </div>
          <MonacoEditor v-model="filteredCode" :read-only="true" />
        </div>
      </div>
      <MonacoEditor v-else ref="editor" v-model="sourceCode" />
    </main>
    <footer>
      <div
        class="flex-none h-12 flex items-center justify-between w-full gap-1 p-2"
      >
        <Button
          id="openJsonPathDoc"
          icon="icon-[tabler--help]"
          as="a"
          link
          v-tooltip.top="'JSON Path 文档'"
          href="https://github.com/JSONPath-Plus/JSONPath"
          target="_blank"
          @click="openURL('https://github.com/JSONPath-Plus/JSONPath')"
        />
        <InputText
          class="flex-auto px-2 py-1 border rounded"
          type="text"
          id="jsonPath"
          placeholder="$.<key>"
          v-model="jsonPathFilter"
          @change="filterJson"
          @input="filterJson"
        />
        <Button
          id="sendRequest"
          icon="icon-[tabler--send]"
          rounded
          v-tooltip.top="'发送 HTTP 请求\n(Ctrl+P)'"
          @click="openSendDialog"
        />
        <Button
          id="pasteReplace"
          icon="icon-[fluent-mdl2--paste-as-code]"
          rounded
          v-tooltip.top="'替换复制\n(Ctrl+Shift+V)'"
          @click="pasteReplace"
        />
        <Button
          id="formatJSON"
          icon="icon-[tabler--braces] w-6 h-6"
          rounded
          v-tooltip.top="'格式化\n(Shift+Alt+F)'"
          @click="triggerEditorAction('editor.action.formatDocument')"
        />
        <Button
          id="collapseAll"
          icon="icon-[tabler--arrows-diagonal-minimize]"
          rounded
          v-tooltip.top="'折叠所有\n(Ctrl+K Ctrl+0)'"
          @click="triggerEditorAction('editor.foldAll')"
        />
        <Button
          id="expandAll"
          icon="icon-[tabler--arrows-move-vertical]"
          rounded
          v-tooltip.top="'展开所有\n(Ctrl+K Ctrl+J)'"
          @click="triggerEditorAction('editor.unfoldAll')"
        />
        <SplitButton
          id="copyJSON"
          icon="icon-[fluent-mdl2--copy]"
          rounded
          :model="copyActions"
          v-tooltip.top="'复制\n(Ctrl+C)'"
          @click="copyJSON()"
        />
        <Button
          id="toggleDiff"
          icon="icon-[tabler--arrows-diff]"
          rounded
          v-tooltip.top="'切换对比模式'"
          @click="toggleDiffMode"
        />
        <Button
          id="editorSetting"
          icon="icon-[tabler--settings]"
          rounded
          v-tooltip.top="'编辑器设置'"
          @click="showSettingPanel($event)"
        />
        <Popover ref="settingPanel">
          <EditorSetting />
        </Popover>
      </div>
    </footer>
    <ServerSelectionDialog 
      v-model:visible="serverDialogVisible" 
      @select="handleServerSelect" 
    />
  </div>
</template>

<script setup lang="ts">
import { JSONPath } from "jsonpath-plus";
import MonacoEditor from "./MonacoEditor.vue";
import MonacoDiffEditor from "./MonacoDiffEditor.vue";
import EditorSetting from "./EditorSetting.vue";
import ServerSelectionDialog from "./ServerSelectionDialog.vue";
import {
  base64FromJson,
  htmlNestedFromJson,
  htmlPlainFromJson,
  javaScriptFromJson,
  jsonFromJson,
  oneLineFromJson,
  quotedMultiLineFromJson,
  quotedOneLineFromJson,
  tomlFromJson,
  yamlFromJson,
} from "../utils/fromJson";
import { StringToJSON } from "../utils/toJson";
import "../workers/monaco";

import { ref, computed } from "vue";
import { Popover } from "primevue";
import { useEditorSetting } from "@/composables/useEditorSetting";
import type { ServerConfig } from "@/composables/useServerStore";
import { xmlFromJson } from "@/utils/xml";

interface IMonacoEditor {
  triggerEditorAction(action: string, payload?: any): void;
  setSourceCode(code: string, shouldFocus?: boolean): void;
}

// const props = defineProps<{ modelValue?: string }>();
// const emit = defineEmits(['update:modelValue']);
// const sourceCode = ref(props.modelValue || '');

const sourceCode = defineModel<string>({
  type: String,
  default: "",
});

const diffMode = ref(false);
const editor = ref<IMonacoEditor | null>(null);
const filteredCode = ref("");
const jsonPathFilter = ref("");
const settingPanel = ref();
const settings = useEditorSetting();
const serverDialogVisible = ref(false);

const showSplitView = computed(() => !diffMode.value && !!jsonPathFilter.value);

const emit = defineEmits<{
  (e: 'open-new-tab', content: string): void
}>();

// watch(sourceCode, (v) => {
//   emit('update:modelValue', v || '');
// });

const copyActions = [
  {
    label: "单行",
    icon: "icon-[tabler--separator-horizontal]",
    command: () => copyJSON(oneLineFromJson),
  },
  {
    label: "转义字符串(多行)",
    icon: "icon-[tabler--blockquote]",
    command: () => copyJSON(quotedMultiLineFromJson),
  },
  {
    label: "转义字符串(单行)",
    icon: "icon-[tabler--quote]",
    command: () => copyJSON(quotedOneLineFromJson),
  },
  {
    label: "Base64",
    icon: "icon-[tabler--a-b]",
    command: () => copyJSON(base64FromJson),
  },
  {
    label: "YAML",
    icon: "icon-[devicon-plain--yaml]",
    command: () => copyJSON(yamlFromJson),
  },
  {
    label: "TOML",
    icon: "icon-[tabler--toml]",
    command: () => copyJSON(tomlFromJson),
  },
  {
    label: "XML",
    icon: "icon-[tabler--file-type-xml]",
    command: () => copyJSON(xmlFromJson),
  },
  {
    label: "Javascript",
    icon: "icon-[tabler--brand-javascript]",
    command: () => copyJSON(javaScriptFromJson),
  },
  {
    label: "Python",
    icon: "icon-[tabler--brand-python]",
    command: () => copyJSON(),
  },
  {
    label: "Rust",
    icon: "icon-[tabler--brand-rust]",
    command: () => copyJSON((text: string) => `json!(${jsonFromJson(text)})`),
  },
  {
    label: "Go",
    icon: "icon-[tabler--brand-golang]",
    command: async () =>
      copyJSON((text: string) => "`" + jsonFromJson(text) + "`"),
  },
  {
    label: "C/C++",
    icon: "icon-[tabler--brand-cpp]",
    command: () =>
      copyJSON(
        (text: string) =>
          text
            .split("\n")
            .map((line) => JSON.stringify(line))
            .join("\n") + ";"
      ),
  },
  {
    label: "Excel(单表头)",
    icon: "icon-[tabler--file-spreadsheet]",
    command: () => copyJSON(htmlPlainFromJson, "text/html"),
  },
  {
    label: "Excel(多级表头)",
    icon: "icon-[tabler--file-spreadsheet]",
    command: () => copyJSON(htmlNestedFromJson, "text/html"),
  },
  {
    label: "更多格式",
    icon: "icon-[tabler--dots]",
    command: () => {
      if ((window as any).utools) {
        (window as any).utools.shellOpenExternal("https://app.quicktype.io/");
      } else {
        window.open("https://app.quicktype.io/", "_blank");
      }
    },
  },
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
  const text = await navigator.clipboard.readText();
  if (!text) return;
  const jsonBody = new StringToJSON(settings.setting.sortKey).toJSON(text);
  sourceCode.value = jsonBody;
  await navigator.clipboard.writeText(jsonBody);
}

async function copyJSON(
  processor?: (text: string) => string,
  _mimetype?: string
): Promise<string> {
  const text = sourceCode.value || "";
  if (!text) return "";
  try {
    const processedText = processor ? processor(text) : text;
    await navigator.clipboard.writeText(processedText);
    return processedText;
  } catch (err) {
    console.error("Failed to copy JSON:", err);
    return "";
  }
}


function filterJson() {
  if (!jsonPathFilter.value) {
    filteredCode.value = "";
    return;
  }
  
  try {
    const jsonContent = sourceCode.value || "";
    // 如果为空，不处理
    if (!jsonContent) return;

    const result = JSONPath({
      path: jsonPathFilter.value.trim(),
      json: JSON.parse(jsonContent),
    });
    
    if (result !== undefined) {
      filteredCode.value = JSON.stringify(result, null, 2);
    } else {
      filteredCode.value = "";
    }
  } catch (err) {
    console.error("JSONPath error:", err);
    // 出错时不更新结果，或者可以显示错误信息
    filteredCode.value = ""; 
  }
}

function openFilteredInNewTab() {
  if (filteredCode.value) {
    emit('open-new-tab', filteredCode.value);
  }
}

function openURL(url: string) {
  if ((window as any).utools) (window as any).utools.shellOpenExternal(url);
}

function toggleDiffMode() {
  diffMode.value = !diffMode.value;
}

function setSourceCode(code: string, shouldFocus: boolean = true) {
  sourceCode.value = code;
  if (editor.value) editor.value.setSourceCode(code, shouldFocus);
}

function openSendDialog() {
  serverDialogVisible.value = true;
}

async function handleServerSelect(server: ServerConfig) {
  const body = sourceCode.value;
  try {
     const headers: Record<string, string> = {};
     server.headers.forEach(h => {
        if (h.enable && h.key) headers[h.key] = h.value;
     });
     
     // Default Content-Type if not set for POST/PUT
     if (!headers['Content-Type'] && (server.method === 'POST' || server.method === 'PUT')) {
        headers['Content-Type'] = 'application/json';
     }

     const res = await fetch(server.url, {
        method: server.method || 'POST',
        headers,
        body: (server.method === 'GET' || server.method === 'HEAD') ? undefined : body
     });

     const text = await res.text();
     // Try to format if JSON
     try {
        const json = JSON.parse(text);
        emit('open-new-tab', JSON.stringify(json, null, 2));
     } catch {
        emit('open-new-tab', text);
     }
  } catch (err: any) {
     console.error(err);
     emit('open-new-tab', `Error: ${err.message}`);
  }
}

defineExpose({
  triggerEditorAction,
  setSourceCode,
  openSendDialog
});
</script>
