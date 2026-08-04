# Fase 23 — Voz, velocidade e comandos falados

**Data:** 3 de agosto de 2026  
**Projeto:** Screen Assistant  
**Branch:** `feat/phase-22a-progressive-first-screen`  
**PR:** #13

## Objetivo

Melhorar a experiência de leitura por voz e permitir o controle do aplicativo por comandos falados, mantendo o microfone desligado por padrão e preservando a privacidade do usuário.

## Leitura por voz

A ação `Ouvir` passa a utilizar preferências configuráveis:

```yaml
idioma_preferencial: pt-BR
velocidade_minima: 0.6x
velocidade_padrao: 1.0x
velocidade_maxima: 1.6x
voz: selecionada_entre_as_disponiveis_no_aparelho
persistencia:
  velocidade: localStorage
  voz: localStorage
  texto_da_resposta: nao_persistido_por_esta_fase
```

A interface oferece:

- controle deslizante de velocidade;
- valor atual visível;
- seletor de voz;
- preferência por vozes em português brasileiro;
- botão `Testar voz`;
- ação `Interromper voz`;
- retomada dos comandos depois do fim da leitura, quando o microfone estava ativado.

## Ativação por comando de voz

Por regra de privacidade e permissão dos navegadores, o usuário precisa tocar uma vez em `Ativar comandos de voz` durante a sessão.

Depois da ativação, o sistema aguarda a frase:

```text
Screen Assistant
```

Duas formas são aceitas:

```text
Screen Assistant, ler resposta
```

ou:

```text
Screen Assistant
→ o aplicativo abre uma janela de oito segundos
→ o usuário fala o comando
```

## Comandos iniciais

```text
Screen Assistant, ler resposta
Screen Assistant, parar voz
Screen Assistant, mais rápido
Screen Assistant, mais devagar
Screen Assistant, velocidade normal
Screen Assistant, analisar
Screen Assistant, nova análise
Screen Assistant, repetir análise
Screen Assistant, ajuda
Screen Assistant, desativar comandos
```

## Limites deliberados

Não são executados por voz:

- abertura da câmera;
- abertura da galeria;
- seleção de arquivos;
- login;
- saída da conta;
- publicação, merge ou operações administrativas;
- qualquer execução financeira.

Essas ações continuam exigindo toque ou interação direta.

## Privacidade

```yaml
microfone_inicial: desligado
ativacao: gesto_explicito_do_usuario
indicador_visual: obrigatorio
transcricao_salva: nao
microfone_persistido_entre_sessoes: nao
desligamento_automatico:
  - pagina_oculta
  - fechamento_da_pagina
  - permissao_negada
  - erro_de_captura
```

A implementação utiliza a API de reconhecimento disponibilizada pelo navegador. O processamento pode variar conforme o navegador e o sistema operacional.

## Compatibilidade degradada

```yaml
sem_speech_recognition:
  leitura_por_voz: disponivel_quando_speechSynthesis_existir
  comandos_falados: desativados
  mensagem_explicativa: exibida

sem_speech_synthesis:
  leitura_por_voz: desativada
  controle_de_velocidade: desativado
  comandos_de_navegacao: dependem_do_reconhecimento
```

## Arquivos

- `public/voice-v23.js`;
- `public/voice-v23.css`;
- `public/design.js`;
- `public/service-worker.js`;
- `tests/phase23-voice-controls.test.js`.

## Critérios de aceitação

1. `Ouvir` reproduz a resposta uma única vez.
2. A velocidade muda entre 0.6x e 1.6x.
3. A preferência permanece após recarregar a página.
4. O seletor prioriza vozes em português.
5. O microfone inicia desligado.
6. O botão de ativação mostra claramente o estado.
7. A frase `Screen Assistant` é reconhecida.
8. Os comandos de leitura, velocidade e navegação funcionam.
9. A leitura não dispara comandos ao ouvir a própria voz sintetizada.
10. O microfone é desligado quando a página sai de primeiro plano.
11. O aplicativo continua utilizável sem reconhecimento de voz.
12. A PWA invalida o cache anterior.

## Governança

```yaml
merge: NAO_AUTORIZADO
producao: INTACTA
validacao_no_dispositivo: PENDENTE
RC: PENDENTE
```
