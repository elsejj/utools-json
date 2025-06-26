import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// 定义 EditorSetting 类型
export interface EditorSetting {
  fontFamily: string
  fontSize: number
  theme: string
}

const LOCAL_KEY = 'json_ultra_editor'

function loadSetting(): EditorSetting {
  const raw = localStorage.getItem(LOCAL_KEY)
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch {
      // ignore parse error, fallback to default
    }
  }
  return {
    fontFamily: "'Cascadia Code NF', 'JetBrains Mono','Fira Code Retina', Consolas, 'Source Code Pro', 'Menlo', 'Courier New', monospace, 'Source Han Sans VF', '思源黑体'",
    fontSize: 13,
    theme: ''
  }
}

function saveSetting(setting: EditorSetting) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(setting))
}

export const useEditorSetting = defineStore('editorSetting', () => {
  const setting = ref<EditorSetting>(loadSetting())

  watch(setting, (val) => saveSetting(val), { deep: true })

  return {
    setting,
  }
})
