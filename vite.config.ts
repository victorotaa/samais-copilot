import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Nenhum `define` de segredo aqui: `define` faz substituição textual no bundle
// público, contornando a proteção do prefixo VITE_ (parecer docs/17 F-04).
// Chave de serviço (STT/LLM) só existe em camada servidor — nunca no cliente.
//
// A separação demo × operação é por RESOLUÇÃO DE MÓDULO, nunca por
// substituição textual: em `--mode operacao` o alias '@demo' aponta para o
// plugue inerte e o pacote de demonstração inteiro fica FORA do grafo de
// módulos — exclusão estrutural, não DCE (docs/24). `vite dev`/`vite build`
// sem `--mode` continuam no pacote real: o deploy atual permanece demo.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // ORDEM IMPORTA: '@demo' antes de '@' (o prefixo não pode capturá-lo).
      '@demo': path.resolve(__dirname, mode === 'operacao' ? 'src/demo/inerte.tsx' : 'src/demo/index.tsx'),
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
}));
