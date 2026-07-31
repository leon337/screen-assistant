# FASE 13 — MVP mobile com câmera e galeria

## Escopo implementado

- entrada por câmera traseira (`capture="environment"`);
- seleção pela galeria;
- pré-visualização da imagem;
- normalização de orientação quando suportada pelo navegador;
- redimensionamento para até 1600 px;
- compressão progressiva para WebP/JPEG;
- limite final de 2 MB;
- reutilização do backend Gemini e do fallback existentes;
- manutenção do compartilhamento de tela no desktop;
- layout responsivo e controles com área de toque adequada;
- copiar e ouvir resposta preservados;
- nenhuma persistência de imagem.

## Riscos e contornos

- navegadores podem variar no tratamento de HEIC; quando a decodificação não for suportada, a interface solicita outra imagem;
- captura contínua da tela do smartphone permanece fora do escopo e exige aplicação nativa;
- acesso à câmera depende da permissão do usuário e de HTTPS;
- a compressão acontece localmente antes do envio.
