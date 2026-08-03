# PHASE-22A — RC-002 do wireframe da primeira tela

## Escopo

Revisar o wireframe corrigido após o `REQUEST_CORRECTION` da RC-001.

## Evidências

- RC-001: `docs/reviews/PHASE-22A-FIRST-SCREEN-DECISIONS-RC-001.md`;
- wireframe inicial: commit `280a016d7eef35f62eb028da2dd6540d4703b5a1`;
- wireframe corrigido: commit `d2b3753afb3f83050258d40b119ffd80c0c3320a`;
- wireframe: `docs/wireframes/PHASE-22A-FIRST-SCREEN-WIREFRAME.md`;
- capturas mobile fornecidas pelo Léo.

## Veredito

```yaml
veredito: PASS_WITH_IMPLEMENTATION_GATES
critical: 0
high: 0
medium: 2
low: 1
```

## Correções validadas

1. escolha do agente deixou de ser etapa obrigatória;
2. seletor `Automático` foi removido;
3. especialista aparece como sugestão da intenção;
4. troca manual ficou opcional;
5. combinações incompatíveis entre intenção, tarefa e perfil foram bloqueadas no contrato;
6. nova análise inicia com `intentId`, `profileId` e `taskId` nulos;
7. onboarding do Leonardo Trader não abre dentro do formulário;
8. barra fixa Foto/Galeria foi removida do wireframe;
9. indicador 1–2–3 foi removido;
10. foco, anúncio acessível e ação Voltar foram especificados;
11. miniatura recebeu limite de altura;
12. Repetir análise e Nova análise possuem comportamentos diferentes e explícitos.

## Simulações

### Análise geral

```text
Imagem → Explicar o conteúdo → Assistente geral → Analisar
```

Resultado: PASS.

### Avaliação de interface

```text
Imagem → Mais opções → Avaliar interface → Especialista em UX → Analisar
```

Resultado: PASS com uma interação adicional prevista.

### Análise gráfica

```text
Imagem → Analisar um gráfico → Leonardo Trader → Mapear cenários → Analisar
```

Resultado: PASS.

## Achados médios

### M-01 — Ordem dos objetivos baseada em hipótese

Os três objetivos principais ainda não são sustentados por dados de uso.

Tratamento: manter a ordem como hipótese inicial e instrumentar métricas futuras.

### M-02 — Wireframe estático

Foco, teclado, rolagem, modal e troca de especialista ainda precisam de validação em protótipo funcional.

Tratamento: preview mobile obrigatório antes de qualquer merge.

## Achado baixo

### L-01 — Microcopy de incompatibilidade

A mensagem é tecnicamente correta, mas pode ser longa para usuários finais.

Tratamento: testar e simplificar sem ocultar o motivo.

## Gates de implementação

1. implementar em camada isolada e reversível;
2. não alterar autenticação, Supabase ou contratos do backend;
3. criar testes para reset de contexto;
4. criar testes para compatibilidade intenção–perfil–tarefa;
5. criar testes para ausência de barras duplicadas;
6. validar foco e teclado no mobile;
7. gerar preview ligado ao HEAD testado;
8. executar RC-003 após validação visual do Léo;
9. manter PR Draft;
10. não realizar merge ou produção sem autorização.

## Estado

```yaml
wireframe: APROVADO
implementacao: AUTORIZADA_SOMENTE_NA_BRANCH
preview: OBRIGATORIO
merge: NAO_AUTORIZADO
producao: INTACTA
```
