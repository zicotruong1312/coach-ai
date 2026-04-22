// Agent portrait images from valorant-api.com CDN
export const AGENT_IMG = {
  Jett:      'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png',
  Reyna:     'https://media.valorant-api.com/agents/e5c5ee28-4bda-6d1e-ba1c-8f9b7bf9e3c0/displayicon.png',
  Sage:      'https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png',
  Sova:      'https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png',
  Brimstone: 'https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png',
  Phoenix:   'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7adea46/displayicon.png',
  Raze:      'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png',
  Breach:    'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png',
  Omen:      'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png',
  Killjoy:   'https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png',
  Cypher:    'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png',
  Skye:      'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png',
  Yoru:      'https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png',
  Astra:     'https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png',
  Viper:     'https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png',
  Chamber:   'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png',
  Neon:      'https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png',
  Fade:      'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png',
  Harbor:    'https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png',
  Gekko:     'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-319aa9de7060/displayicon.png',
  Deadlock:  'https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png',
  Iso:       'https://media.valorant-api.com/agents/0e38b510-41a8-5780-7e1f-9d3e1b3b0b7e/displayicon.png',
  Clove:     'https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png',
  Vyse:      'https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/displayicon.png',
}

// Map accent colors
export const MAP_COLOR = {
  Breeze:   '#48cae4', Haven:  '#52b788', Split:   '#e76f51',
  Bind:     '#e9c46a', Ascent: '#a8dadc', Icebox:  '#90e0ef',
  Fracture: '#c77dff', Pearl:  '#4895ef', Lotus:   '#f4a261',
  Sunset:   '#fb8500', Abyss:  '#6d6875',
}

export function agentImg(name) {
  return AGENT_IMG[name] || null
}

export function mapColor(name) {
  return MAP_COLOR[name] || '#7b91a8'
}
