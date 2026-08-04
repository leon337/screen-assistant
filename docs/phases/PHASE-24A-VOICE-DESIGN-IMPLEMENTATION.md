# Fase 24A — Voz e design mobile

## Estado

```yaml
fase: 24A
objetivo: simplificar_controles_de_voz_no_resultado
implementacao: CONCLUIDA_NA_BRANCH
merge: NAO_AUTORIZADO
producao: INTACTA
```

## Decisão

A lógica validada da Fase 23 foi preservada. A Fase 24A adiciona uma camada de apresentação que reutiliza os controles existentes sem clonar eventos nem criar uma segunda máquina de voz.

## Entregas

- barra compacta com estados separados de microfone e leitura;
- botão único `Ouvir/Parar`;
- velocidade visível na barra;
- acesso direto aos ajustes;
- painel modal no desktop e folha inferior no mobile;
- seletor pt-BR com nome curto e detalhe separado;
- comandos disponíveis somente dentro dos ajustes;
- remoção visual das ações duplicadas no mobile;
- reserva de espaço para evitar sobreposição com a navegação inferior;
- observabilidade por `data-voice-design=phase-24a`.

## Reutilização da Fase 23

A Fase 24A não reimplementa síntese nem reconhecimento. A barra aciona os controles já validados:

```text
barra 24A
→ botões internos da Fase 23
→ síntese pt-BR
→ reconhecimento pt-BR
→ comandos e velocidade existentes
```

O corpo de configurações existente é movido para a nova folha, preservando os listeners originais.

## Comportamento mobile

```yaml
cabeçalho:
  botão_de_voz_antigo: oculto
resultado:
  ouvir_antigo: oculto
  interromper_antigo: oculto
barra_compacta:
  microfone: visível
  leitura: visível
  velocidade: visível
  ajustes: visível
painel:
  formato: folha_inferior
  lista_de_comandos: recolhida
```

## Fora do escopo

- compartilhamento automático de tela;
- captura contínua;
- aplicativo Android nativo;
- alteração do backend de análise;
- inglês e espanhol.

Esses itens permanecem nas Fases 24B e 24C.

## Critérios de aceite

1. Microfone e leitura exibem estados independentes.
2. O usuário consegue ouvir e interromper pelo mesmo botão.
3. Ajustes não alongam a página do resultado.
4. O seletor não exibe o rótulo técnico completo como texto principal.
5. A lista de comandos não fica aberta na página principal.
6. A barra reserva espaço e não cobre os últimos controles.
7. A lógica da Fase 23 permanece funcional.
8. A PWA publica os novos arquivos com uma nova geração de cache.
