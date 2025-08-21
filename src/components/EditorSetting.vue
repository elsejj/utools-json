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
  </div>
</template>

<script setup lang="ts">
import { useEditorSetting } from '../composables/useEditorSetting'

const editorSetting = useEditorSetting()
</script>
