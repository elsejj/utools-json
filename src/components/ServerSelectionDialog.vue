<template>
  <Dialog v-model:visible="visible" modal header="发送 HTTP 请求" :style="{ width: '50rem' }">
    <!-- View: LIST -->
    <div v-if="view === 'list'" class="flex flex-col gap-4">
       <!-- Search Input -->
       <div class="flex gap-2">
         <InputText v-model="searchQuery" placeholder="搜索名称或URL / 输入新URL" class="flex-1" autofocus @keydown.enter="onEnter" />
       </div>
       
       <!-- Server List -->
       <div class="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
         <div v-for="server in filteredServers" :key="server.id" 
              class="p-2 border rounded hover:bg-slate-100 dark:hover:bg-surface-700 cursor-pointer flex items-center justify-between"
              @click="selectServer(server)">
            <div class="flex-1">
              <div class="font-bold">{{ server.name }}</div>
              <div class="text-xs opacity-70 flex gap-2">
                 <span class="font-mono bg-surface-200 dark:bg-surface-800 px-1 rounded">{{ server.method || 'POST' }}</span>
                 <span>{{ server.url }}</span>
              </div>
            </div>
            <div class="flex gap-2">
               <Button icon="icon-[tabler--pencil]" text rounded @click.stop="editServer(server)" />
               <Button icon="icon-[tabler--trash]" text rounded severity="danger" @click.stop="deleteServer(server.id)" />
            </div>
         </div>
         
         <div v-if="isUrlInput" 
              class="p-2 border rounded border-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer flex items-center justify-between"
              @click="createNewServerFromInput">
            <div class="flex-1">
               <div class="font-bold text-primary">使用新 URL 创建请求...</div>
               <div class="text-xs opacity-70">{{ searchQuery }}</div>
            </div>
            <Button icon="icon-[tabler--arrow-right]" text rounded />
         </div>

         <div v-if="filteredServers.length === 0 && !isUrlInput" class="text-center opacity-50 p-4">
            没有找到匹配的服务器
         </div>
       </div>
    </div>

    <!-- View: EDIT -->
    <div v-else class="flex flex-col gap-4">
       <div class="flex gap-2">
          <InputText v-model="editingForm.name" placeholder="服务器名称" class="flex-1" />
          <div class="flex items-center gap-1 border rounded px-2">
             <span class="text-sm opacity-70">Method:</span>
             <select v-model="editingForm.method" class="bg-transparent outline-none">
                <option>POST</option>
                <option>PUT</option>
                <option>GET</option>
                <option>DELETE</option>
                <option>PATCH</option>
             </select>
          </div>
       </div>
       <InputText v-model="editingForm.url" placeholder="URL (http://...)" />
       
       <div class="border rounded p-2 flex flex-col gap-2">
          <div class="flex justify-between items-center">
             <label class="font-bold text-sm">Headers</label>
             <Button label="Add" size="small" icon="icon-[tabler--plus]" text @click="addHeader" />
          </div>
          <div class="max-h-[200px] overflow-y-auto flex flex-col gap-1">
             <div v-for="(h, idx) in editingForm.headers" :key="idx" class="flex gap-1 items-center">
                <InputText v-model="h.key" placeholder="Key" class="w-1/3 p-1 text-sm" />
                <InputText v-model="h.value" placeholder="Value" class="flex-1 p-1 text-sm" />
                <Button icon="icon-[tabler--trash]" text severity="danger" size="small" @click="headerRemove(idx)" />
             </div>
             <div v-if="editingForm.headers.length === 0" class="text-xs opacity-50 text-center py-2">
                User-Agent 和 Content-Type 会自动添加
             </div>
          </div>
       </div>

       <div class="flex justify-end gap-2 mt-2">
          <Button label="返回" text @click="view = 'list'" />
          <Button label="保存并发送" icon="icon-[tabler--send]" @click="saveAndSelect" />
       </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useServerStore, type ServerConfig } from '@/composables/useServerStore';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const props = defineProps<{
  visible: boolean
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'select', server: ServerConfig): void;
}>();

const serverStore = useServerStore();

const visible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v)
});

const view = ref<'list' | 'edit'>('list');
const searchQuery = ref('');
const isUrlInput = computed(() => {
  const s = searchQuery.value.trim();
  return s.startsWith('http://') || s.startsWith('https://');
});

const filteredServers = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return serverStore.servers;
  return serverStore.servers.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.url.toLowerCase().includes(q)
  );
});

// Editing State
const editingForm = ref<ServerConfig>({
  id: '',
  name: '',
  url: '',
  method: 'POST',
  headers: []
});

function resetForm() {
  editingForm.value = {
    id: '',
    name: '',
    url: '',
    method: 'POST',
    headers: []
  };
}

function selectServer(server: ServerConfig) {
  emit('select', server);
  visible.value = false;
}

function editServer(server: ServerConfig) {
  editingForm.value = JSON.parse(JSON.stringify(server));
  view.value = 'edit';
}

function deleteServer(id: string) {
  if (confirm('确定删除此服务器配置吗?')) {
    serverStore.removeServer(id);
  }
}

function createNewServerFromInput() {
  resetForm();
  editingForm.value.url = searchQuery.value.trim();
  editingForm.value.name = new URL(editingForm.value.url).host;
  view.value = 'edit';
}

function addHeader() {
  editingForm.value.headers.push({ key: '', value: '', enable: true });
}

function headerRemove(idx: number) {
  editingForm.value.headers.splice(idx, 1);
}

function saveAndSelect() {
  if (!editingForm.value.name) editingForm.value.name = 'Unnamed Server';
  if (!editingForm.value.id) editingForm.value.id = crypto.randomUUID();
  
  // Clone to break reference
  const server = JSON.parse(JSON.stringify(editingForm.value));
  serverStore.addServer(server);
  
  selectServer(server);
}

function onEnter() {
   if (filteredServers.value.length > 0) {
      selectServer(filteredServers.value[0]);
   } else if (isUrlInput.value) {
      createNewServerFromInput();
   }
}

watch(visible, (v) => {
  if (v) {
    view.value = 'list';
    searchQuery.value = '';
  }
});
</script>
