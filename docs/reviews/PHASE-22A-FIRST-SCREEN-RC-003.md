# Fase 22A — RC-003 da primeira tela progressiva

## Escopo

Revisar a implementação funcional do wireframe aprovado para a primeira tela do Screen Assistant.

## Fluxo revisado

```text
Enviar imagem
→ escolher intenção
→ receber especialista sugerido
→ analisar
```

## Evidências

```yaml
branch: feat/phase-22a-progressive-first-screen
PR: 13
head_testado: 04701951dc688156065e17030814c19372bf6f7e
workflow: 30787758230
job: 91604635853
testes: 105
aprovados: 105
falhas: 0
segredos: PASS
preview_branch_alias: screen-assistant-preview-20260731-git-feat-2b2ded-predix-ai-br.vercel.app
runtime_errors_fatal: 0
```

## Critérios avaliados

### Estado inicial

- imagem ainda não selecionada;
- objetivos ocultos;
- especialista oculto;
- pergunta e CTA ocultos;
- Foto e Galeria disponíveis sem duplicação;
- controles técnicos retirados do fluxo mobile.

Resultado: `PASS`.

### Estado depois da imagem

- miniatura limitada;
- ação Trocar imagem;
- três objetivos principais;
- Mais opções;
- foco transferido ao título dos objetivos.

Resultado: `PASS`.

### Roteamento de especialistas

- objetivo define perfil e tarefa;
- especialista aparece como sugestão;
- troca manual recalcula uma combinação válida;
- nenhuma opção Automático redundante;
- onboarding completo do Trader removido do formulário.

Resultado: `PASS`.

### Contexto

- nova análise inicia sem intenção, perfil ou tarefa;
- somente profundidade permanece como preferência;
- Nova análise limpa imagem, contexto, pergunta e resposta;
- Repetir análise preserva o contexto atual;
- análise sem intenção é bloqueada no cliente e na requisição.

Resultado: `PASS`.

### Mobile

- indicador 1–2–3 removido da criação;
- barra Foto/Galeria duplicada removida;
- navegação inferior removida durante a criação;
- Instalar e Modo desktop retirados do fluxo;
- lista vertical e áreas de toque adequadas.

Resultado: `PASS_ESTATICO`.

### Desktop

A primeira versão da implementação ocultava o compartilhamento de tela e a navegação também no desktop. O problema foi detectado antes da RC e corrigido por uma camada específica para telas maiores.

Resultado: `PASS_APOS_CORRECAO`.

## Incidentes da implementação

### Atualização com SHA incorreto

```yaml
status: 409
causa: commit_SHA_usado_no_lugar_do_blob_SHA
efeito: nenhum
classe: RECUPERAVEL
recuperacao: buscar_blob_SHA_e_repetir
resultado: corrigido
```

### Regressão preventiva de desktop

```yaml
causa: regras_de_simplificacao_com_escopo_amplo
efeito_na_main: nenhum
classe: RECUPERAVEL
recuperacao: restauracao_desktop_e_teste_dedicado
resultado: corrigido
```

## Achados

```yaml
critical: 0
high: 0
medium: 1
low: 1
```

### Médio — validação no dispositivo

Os testes comprovam estrutura, contratos e regressão, mas não substituem a validação real de:

- toque;
- teclado;
- câmera e galeria;
- rolagem;
- abertura e fechamento do diálogo;
- mudança visual entre os estados.

### Baixo — ordem dos objetivos

A ordem `Explicar`, `Problema`, `Gráfico` permanece como hipótese até existirem métricas de uso.

## Veredito

`PASS_WITH_DEVICE_VALIDATION_GATE`

## Gate

Antes do merge:

1. abrir o preview no celular do Léo;
2. validar login e tela inicial;
3. tirar foto e escolher da galeria;
4. selecionar cada objetivo principal;
5. abrir Mais opções;
6. trocar especialista;
7. executar uma análise;
8. iniciar Nova análise e confirmar o reset;
9. confirmar recursos desktop em computador;
10. obter autorização explícita de merge.

## Governança

```yaml
PR: 13
merge: NAO_AUTORIZADO
producao: INTACTA
```
