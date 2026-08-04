# Fase 24A — Incidente 004 — voz inoperante no computador

## Relato

No Android, leitura e comandos estavam operacionais. No computador, a leitura por voz e os comandos falados não funcionavam. O fluxo também exigia uma chamada longa, `Screen Assistente`, antes do comando.

## Diagnóstico

### Leitura

O desktop ainda exibia os botões legados, que dependiam do sintetizador local do navegador. Em Linux e em alguns navegadores, a disponibilidade e a qualidade desse sintetizador variam.

### Comandos

O módulo dependia de `SpeechRecognition` ou `webkitSpeechRecognition`. Quando a API não existe ou não funciona no navegador, o botão ficava inoperante.

### Experiência

A frase de ativação obrigatória aumentava o esforço e a taxa de falhas de reconhecimento.

## Correção

### Leitura universal

- os botões legados foram removidos da experiência desktop;
- a barra universal passou a ser o único controle principal;
- o botão `Ouvir` usa a voz neural e o streaming já validados no Android;
- a voz local permanece como fallback.

### Push-to-talk no computador

```text
clicar em Mic
→ falar um comando curto por até 6 segundos
→ enviar o áudio autenticado
→ Gemini transcreve
→ executar o comando no cliente
```

A gravação não é persistida e a API não entra no cache da PWA.

### Comandos simplificados

- `ler`
- `parar`
- `analisar`
- `novo`
- `repetir`
- `rápido`
- `devagar`
- `normal`
- `ajuda`

A expressão `Screen Assistente` deixou de ser obrigatória no computador, mas continua aceita como prefixo opcional.

## Segurança

- autenticação Supabase obrigatória;
- chave Gemini somente no servidor;
- limite por usuário e IP;
- áudio máximo de 2 MB;
- gravação máxima de 6 segundos no cliente;
- formatos permitidos controlados;
- áudio não persistido;
- API e áudio fora do service worker.

## Evidências funcionais

```yaml
head: 78ad2df8b67b9f2ca28a205d8aebb90ad8619a10
workflow: 30872207378
job: 91876338841
tests: 163
pass: 163
fail: 0
secrets: PASS
deployment: dpl_DtLuDpfJDTrWNEPp7p4gPVW4BnRj
deployment_state: READY
```

## Estado

```yaml
Android: PASS
Desktop: AGUARDANDO_VALIDACAO
merge: NAO_AUTORIZADO
```
