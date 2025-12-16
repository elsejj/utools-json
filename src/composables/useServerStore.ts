import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface HttpHeader {
  key: string
  value: string
  enable: boolean
}

export interface ServerConfig {
  id: string
  name: string
  url: string
  method: string
  headers: HttpHeader[]
}

const LOCAL_SERVER_KEY = 'json_ultra_server_list'

function loadServers(): ServerConfig[] {
  const raw = localStorage.getItem(LOCAL_SERVER_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as ServerConfig[]
    } catch {
      // ignore
    }
  }
  return []
}

function saveServers(servers: ServerConfig[]) {
  localStorage.setItem(LOCAL_SERVER_KEY, JSON.stringify(servers))
}

export const useServerStore = defineStore('serverStore', () => {
  const servers = ref<ServerConfig[]>(loadServers())

  watch(servers, (val) => saveServers(val), { deep: true })

  function addServer(server: ServerConfig) {
    const idx = servers.value.findIndex(s => s.id === server.id)
    if (idx >= 0) {
      servers.value[idx] = server
    } else {
      servers.value.push(server)
    }
  }

  function removeServer(id: string) {
    const idx = servers.value.findIndex(s => s.id === id)
    if (idx >= 0) {
      servers.value.splice(idx, 1)
    }
  }

  return {
    servers,
    addServer,
    removeServer
  }
})
