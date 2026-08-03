# Fase 24A — Incidente 003 — Latência no início da voz natural

## Relato

Na validação real no Android, a voz natural demorou muito para iniciar após o toque em `Ouvir`.

## Causa confirmada

O cliente iniciava todo o processo somente depois do toque:

```text
toque em Ouvir
→ validar sessão
→ enviar até 4.000 caracteres
→ aguardar geração completa do Gemini TTS
→ converter PCM para WAV
→ iniciar reprodução
```

Não havia pré-carregamento nem reutilização do áudio da resposta atual.

## Correção

```yaml
preload:
  gatilho: resposta_completa_e_aria_busy_false
  atraso_ms: 450
  execução: segundo_plano

cache:
  tipo: memória_da_sessão
  chave: hash_do_texto_da_resposta
  persistência: nenhuma
  reutilização: repetir_leitura

invalidação:
  - nova_resposta
  - mudança_do_texto
  - saída_do_modo_natural
  - encerramento_da_página
```

## Comportamento esperado

```text
resposta pronta
→ áudio natural começa a ser preparado
→ usuário toca em Ouvir
→ áudio em cache inicia sem nova chamada
```

Quando o toque ocorrer antes de o pré-carregamento terminar, o player reutiliza a solicitação já em andamento em vez de iniciar outra.

## Privacidade e custo

- áudio permanece apenas em memória;
- nenhum PCM, WAV ou base64 é salvo no armazenamento local;
- API e áudio continuam fora do cache do service worker;
- apenas a resposta atual permanece preparada;
- uma nova resposta invalida o conteúdo anterior.

## Critérios de aceite

1. O pré-carregamento só começa com resposta completa.
2. Repetir leitura não gera novo áudio.
3. Alterar apenas a velocidade não gera novo áudio.
4. Resposta nova não reutiliza áudio antigo.
5. Falha no pré-carregamento preserva o fallback local.
6. O microfone só é pausado quando o áudio está pronto para tocar.
7. A PWA publica uma nova geração de cache.
8. O tempo percebido no Android deve ser revalidado.

## Governança

```yaml
PR: 13
branch: feat/phase-22a-progressive-first-screen
merge: NAO_AUTORIZADO
produção: NAO_ALTERADA
estado: AGUARDANDO_CI_E_PREVIEW
```
