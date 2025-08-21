<template>
  <div class="w-full h-full flex flex-col">
    <header class="flex-none border-b bg-surface p-2 flex items-center gap-2">
      <div class="flex items-center gap-2">
        <Button icon="icon-[tabler--plus]" size="small" rounded  @click="addTab()" v-tooltip.top="'新建标签'" />
      </div>
      <div class="flex-1 flex items-center gap-1 overflow-x-auto">
        <template v-for="(tab, idx) in tabs" :key="tab.id">
          <div :class="['px-3 py-1 rounded cursor-pointer flex items-center gap-2', activeTab === idx ? 'bg-surface-300 shadow' : 'bg-transparent']"
            @click="activateTab(idx)">
            <span class="text-sm">{{ tab.title }}</span>
            <Button icon="icon-[tabler--x] h-6" size="small" severity="danger" text @click.stop="closeTab(idx)" />
          </div>
        </template>
      </div>
    </header>

    <main class="flex-auto">
      <JsonEditor v-model="tabs[activeTab].content" ref="jsonEditor" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import JsonEditor from './components/JsonEditor.vue';
import { StringToJSON } from './utils/toJson';
import { useEditorSetting } from './composables/useEditorSetting';


const settings = useEditorSetting();

if ((window as any).utools) {
  (window as any).utools.onPluginEnter((action: any) => {
    //console.log("onPluginEnter", action);

    if (typeof action.payload === 'string' && action.payload.length > 5) {
      var content = action.payload;
      try {
        content = new StringToJSON().toJSON(action.payload) || '';
        if (tabs.value.length === 1 && tabs.value[0].content === '') {
          tabs.value[0].content = content;
          activateTab(0);
        } else {
          addTab(content);
        }
      } catch (error) {
      }
    }else{
      activateTab(tabs.value.length - 1);
    }
    
  });
  (window as any).utools.onPluginOut(() => {
    //console.log("onPluginOut");
    settings.saveTabs(tabs.value);
  });
}


type Tab ={
  id: string;
  title: string;
  content: string;
}

const tabs = ref<Tab[]>([newTab()]);
const activeTab = ref(0);
const jsonEditor = ref<InstanceType<typeof JsonEditor> | null>(null);


onMounted(() => {
  //console.log("App mounted");
  tabs.value = settings.loadTabs() || [
    newTab()
  ];
});

onUnmounted(() => {
  //console.log("App unmounted");
  settings.saveTabs(tabs.value);
});


function newTab(content: string = '') : Tab {
  const now = new Date();
  const yymmdd_hhmmss = `${now.getFullYear() % 100}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  return { id: yymmdd_hhmmss, title: yymmdd_hhmmss, content };
}

function addTab(content: string = '') {
  tabs.value.push(newTab(content));
  activateTab(tabs.value.length - 1);
}

function activateTab(index: number) {
  if (index >= 0 && index < tabs.value.length) {
    //console.log("active tab", index, tabs.value[index])
    activeTab.value = index;
    if (jsonEditor.value) {
      jsonEditor.value.setSourceCode(tabs.value[index]?.content || '');
    }
  }else{
    console.log("inactive tab", index)
  }
}

function closeTab(index: number) {
  if (tabs.value.length === 1) {
    // clear content instead of closing last tab
    tabs.value[0].content = '';
    activeTab.value = 0;
    return;
  }
  tabs.value.splice(index, 1);
  if (activeTab.value >= tabs.value.length) {
    activateTab(tabs.value.length - 1);
  }else{
    activateTab(activeTab.value);
  }
}
</script>
