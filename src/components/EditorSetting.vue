<template>
  <div class="w-64 p-2 space-y-4">
    <div class="mb-4">
      <label class="block text-sm font-medium mb-1">字体</label>
      <InputText v-model="editorSetting.setting.fontFamily" class="w-full" />
    </div>
    <div class="mb-4">
      <label class="block text-sm font-medium mb-1">字体大小</label>
      <InputNumber v-model="editorSetting.setting.fontSize" class="w-full" :min="10" :max="40" />
    </div>
    <div class="mb-4">
      <label class="block text-sm font-medium mb-1">格式化时键排序</label>
      <ToggleSwitch v-model="editorSetting.setting.sortKey"  />
    </div>
    <div class="mb-4">
      <label class="block text-sm font-medium mb-1">AI模型</label>
      <Select v-model="editorSetting.setting.aiModel" :options="aiModels" optionLabel="label" optionValue="id" placeholder="选择AI模型" class="w-full md:w-56" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useEditorSetting } from '../composables/useEditorSetting'

const editorSetting = useEditorSetting()

const aiModels = ref<UtoolsAiModel[]>([])

onMounted(async () => {
  const utools = window.utools
  if (utools) {
    aiModels.value = await utools.allAiModels()
  }
})

</script>
