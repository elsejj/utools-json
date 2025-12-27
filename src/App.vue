<template>
  <div class="w-full h-full flex flex-col" @keydown="onShortcut">
    <header class="flex-none border-b bg-surface py-2 flex items-center gap-2 h-12">
      <div class="flex items-center gap-2 pl-2">
        <Button icon="icon-[tabler--plus]" @click="addTab()" class="text-sm h-6 w-6 rounded" v-tooltip.top="'新建标签\n(Ctrl+N)'" />
      </div>
      <div class="flex-1 flex items-center gap-1 overflow-x-auto py-2">
        <template v-for="(tab, idx) in tabs" :key="tab.id">
          <div :class="[
            'px-2 py-1 rounded cursor-pointer flex items-center gap-2',
            activeTab === idx ? 'bg-surface-300 shadow' : 'bg-transparent',
          ]" @click="activateTab(idx, $event)" @contextmenu="activateTab(idx, $event)">
            <span class="text-sm">{{ tab.title }}</span>
            <Button icon="icon-[tabler--x]" class="text-sm h-4" severity="danger" text @click.stop="closeTab(idx)" />
          </div>
        </template>
      </div>
      <ContextMenu ref="titleMenu" :model="titleMenuItems" />
    </header>

    <main class="flex-auto">
      <JsonEditor 
        v-model="tabs[activeTab].content" 
        v-model:filter="tabs[activeTab].filter"
        ref="jsonEditor" 
        @open-new-tab="addTab"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import JsonEditor from "./components/JsonEditor.vue";
import { StringToJSON } from "./utils/toJson";
import { useEditorSetting } from "./composables/useEditorSetting";

const settings = useEditorSetting();
const titleMenu = ref();
const titleMenuItems = [
  {
    label: "关闭",
    command: () => {
      closeTab(activeTab.value);
    },
  },
  {
    label: "关闭左侧所有",
    command: () => {
      closeTab(activeTab.value, "left");
    },
  },
  {
    label: "关闭右侧所有",
    command: () => {
      closeTab(activeTab.value, "right");
    },
  },
  {
    label: "关闭其他",
    command: () => {
      closeTab(activeTab.value, "other");
    },
  },
];

if ((window as any).utools) {
  (window as any).utools.onPluginEnter((action: any) => {
    //console.log("onPluginEnter", action);

    if (typeof action.payload === "string" && action.payload.length > 5) {
      var content = action.payload;
      try {
        content =
          new StringToJSON(settings.setting.sortKey).toJSON(action.payload) ||
          "";
        if (tabs.value.length === 1 && tabs.value[0].content === "") {
          tabs.value[0].content = content;
          activateTab(0);
        } else {
          addTab(content);
        }
      } catch (error) { }
    } else {
      activateTab(tabs.value.length - 1);
    }
  });
  (window as any).utools.onPluginOut(() => {
    //console.log("onPluginOut");
    settings.saveTabs(tabs.value);
  });
}

type Tab = {
  id: string;
  title: string;
  content: string;
  filter?: string;
};

const tabs = ref<Tab[]>([newTab()]);
const activeTab = ref(0);
const jsonEditor = ref<InstanceType<typeof JsonEditor> | null>(null);

onMounted(() => {
  //console.log("App mounted");
  tabs.value = settings.loadTabs() || [newTab()];
  if (jsonEditor.value) {
  }
});

onUnmounted(() => {
  //console.log("App unmounted");
  settings.saveTabs(tabs.value);
});

function newTab(content: string = ""): Tab {
  const now = new Date();
  const yymmdd_hhmmss = `${now.getFullYear() % 100}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;

  return { id: yymmdd_hhmmss, title: yymmdd_hhmmss, content, filter: "" };
}

function addTab(content: string = "") {
  tabs.value.push(newTab(content));
  activateTab(tabs.value.length - 1);
  settings.saveTabs(tabs.value);
}

function activateTab(index: number, event?: MouseEvent) {

  if (index < 0) {
    index = tabs.value.length - 1;
  } else if (index >= tabs.value.length) {
    index = 0;
  }

  activeTab.value = index;
  if (jsonEditor.value) {
    jsonEditor.value.setSourceCode(tabs.value[index]?.content || "");
  }

  if (event?.buttons === 2 || event?.button === 2) {
    // right click
    titleMenu.value?.show(event);
  }
  settings.saveTabs(tabs.value);
}

function closeTab(index: number, mode: "" | "left" | "right" | "other" = "") {
  if (tabs.value.length === 1) {
    // clear content instead of closing last tab
    tabs.value[0].content = "";
    activeTab.value = 0;
  } else if (mode === "left") {
    tabs.value.splice(0, index);
    activateTab(0);
  } else if (mode === "right") {
    tabs.value.splice(index + 1);
    activateTab(index);
  } else if (mode === "other") {
    const currentTab = tabs.value[index];
    tabs.value = [currentTab];
    activeTab.value = 0;
  } else {
    tabs.value.splice(index, 1);
    if (activeTab.value >= tabs.value.length) {
      activateTab(tabs.value.length - 1);
    } else {
      activateTab(activeTab.value);
    }
  }
  settings.saveTabs(tabs.value);
}

function onShortcut(event: KeyboardEvent) {
  if (event.ctrlKey && event.key === "n") {
    event.preventDefault();
    addTab();
  } else if (event.ctrlKey && event.key === "w") {
    event.preventDefault();
    closeTab(activeTab.value);
  } else if (event.ctrlKey && event.key === "p") {
    event.preventDefault();
    if (jsonEditor.value) {
      jsonEditor.value.openSendDialog();
    }
  } else if (event.ctrlKey && event.key === "Tab") {
    event.preventDefault();
    if (event.shiftKey) {
      // Move to the previous tab
      activateTab(activeTab.value - 1);
    } else {
      // Move to the next tab
      activateTab(activeTab.value + 1);
    }
  }
}
</script>
