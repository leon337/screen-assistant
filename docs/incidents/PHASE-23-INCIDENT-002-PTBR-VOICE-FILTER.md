# PHASE-23-INCIDENT-002 — filtro de vozes pt-BR no Android

## Estado

```yaml
classificacao: HIGH
estado: CORRIGIDO_NA_BRANCH
origem: validacao_no_dispositivo_Android
merge: NAO_AUTORIZADO
```

## Evidência observada

Durante a validação da Fase 23 no celular, o seletor de voz apresentou idiomas não permitidos, incluindo assamês, búlgaro, bengali, sueco, tâmil, turco, ucraniano e outros. A voz ativa ficou registrada como `assamês Índia · as_IN`.

O painel informava que o microfone estava ativo, mas a configuração linguística da síntese não correspondia ao português do Brasil.

## Causa raiz

O filtro anterior aceitava apenas identificadores no formato BCP 47 com hífen:

```js
/^pt(?:-|$)/i
```

No Android, as vozes do aparelho foram retornadas com identificadores que usam sublinhado, como `as_IN` e potencialmente `pt_BR`. Como nenhuma voz correspondia ao filtro, a implementação executava este fallback:

```js
return portuguese.length ? portuguese : voices;
```

Esse fallback liberava todas as vozes instaladas no aparelho.

## Correção

- idioma da fase fixado em `pt-BR`;
- normalização de `_` para `-`;
- aceitação apenas de `pt-BR`, `pt_BR` e variantes com subtags;
- remoção completa do fallback para todos os idiomas;
- descarte da preferência persistida quando ela não pertence ao conjunto pt-BR;
- rótulo da interface alterado para `Voz em português (Brasil)`;
- cache PWA invalidado;
- reconhecimento alterado para sessões curtas com reinício automático;
- número de alternativas de transcrição aumentado para cinco;
- inclusão de variações fonéticas de `Screen Assistant` e `Screen Assistente`.

## Critérios de validação

```yaml
seletor:
  idiomas_não_pt_BR: 0
  voz_assames: ausente
  voz_portugues_Brasil: obrigatoria_quando_instalada
leitura:
  utterance_lang: pt-BR
reconhecimento:
  recognition_lang: pt-BR
  continuous: false
  maxAlternatives: 5
cache:
  versao: screen-assistant-v23-voice-controls-ptbr-hotfix-2
```

## Gate restante

Revalidar no mesmo aparelho:

1. atualizar completamente a aplicação;
2. confirmar que o seletor mostra somente português do Brasil;
3. testar a voz em 1.0x;
4. ativar o microfone;
5. dizer `Screen Assistente, ler resposta`;
6. testar `mais rápido`, `mais devagar` e `parar voz`;
7. registrar a transcrição exibida caso algum comando não seja reconhecido.
