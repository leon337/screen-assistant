# RC independente — Fase 16 Especialistas de Análise

## Escopo revisado

- catálogo de especialistas no servidor;
- validação e fallback de `profileId`;
- composição segura do prompt;
- seletor visual progressivo;
- identificação do especialista no resultado;
- reanálise da imagem atual;
- testes estáticos e regressão da suíte existente.

## Checklist de Emily

- [ ] nenhum prompt profissional controlado pelo cliente;
- [ ] identificador inválido resulta em `general`;
- [ ] conteúdo ilegível não é inventado;
- [ ] perfil Trader não produz recomendação financeira;
- [ ] câmera, galeria, captura, Markdown e voz permanecem preservados;
- [ ] seletor acessível por teclado e leitor de tela;
- [ ] reanálise não perde a imagem;
- [ ] CI completa em PASS;
- [ ] preview isolado em READY;
- [ ] Critical = 0 e High = 0.

## Veredito preliminar

`PENDING_CI_AND_PREVIEW`

A revisão final deve ser registrada no PR após a conclusão da CI e da validação do preview. Nenhum merge ou deploy de produção é autorizado por este documento.
