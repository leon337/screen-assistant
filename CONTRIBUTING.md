# Contribuindo

## Fluxo recomendado

1. crie uma branch a partir de `main`;
2. faça mudanças pequenas e rastreáveis;
3. execute `npm test`;
4. não inclua segredos nem capturas pessoais;
5. abra um Pull Request descrevendo problema, solução, riscos e testes;
6. aguarde revisão antes de promover para produção.

## Convenção de commits

Exemplos:

```text
feat: adiciona modo conciso de resposta
fix: trata resposta interrompida do provedor
docs: registra arquitetura da fase 14
test: cobre cancelamento da análise
```

## Critérios mínimos de aceite

- testes automatizados aprovados;
- nenhuma chave no diff;
- desktop e mobile sem regressão;
- API continua sem persistir imagens;
- documentação atualizada quando houver mudança de comportamento.
