# Fase 23 — Incidente 001: política HTTP bloqueava o microfone

**Data:** 3 de agosto de 2026  
**Projeto:** Screen Assistant  
**PR:** #13

## Sintoma potencial

A implementação de reconhecimento de voz estava correta no cliente, mas o preview publicava o cabeçalho:

```http
Permissions-Policy: camera=(self), microphone=(), geolocation=()
```

O valor `microphone=()` desabilitava o microfone para todas as origens, impedindo comandos falados mesmo após autorização do usuário.

## Classificação

```yaml
classe: CONFIGURACAO
severidade_inicial: HIGH
efeito_na_main: nenhum
efeito_em_producao: nenhum
efeito_no_preview_da_branch: reconhecimento_de_voz_bloqueado
leitura_por_voz: nao_afetada
```

## Causa

A política havia sido criada antes da Fase 23, quando o aplicativo não utilizava microfone. O novo requisito tornou essa restrição incompatível.

## Correção

```http
Permissions-Policy: camera=(self), microphone=(self), geolocation=()
```

A nova política:

- permite câmera e microfone somente para a própria origem;
- não autoriza origens externas;
- mantém geolocalização bloqueada;
- continua exigindo permissão explícita do navegador.

## Controle de regressão

A CI passou a verificar:

```yaml
esperado: microphone=(self)
proibido: microphone=()
```

Arquivo de teste:

- `tests/phase23-voice-controls.test.js`.

## Estado

```yaml
correcao_versionada: true
validacao_CI: pendente_no_HEAD_atual
validacao_preview: pendente
merge: NAO_AUTORIZADO
```
