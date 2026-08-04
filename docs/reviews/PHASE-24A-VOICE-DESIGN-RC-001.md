# RC-001 — Fase 24A: voz e design mobile

## Escopo revisado

- barra compacta de voz;
- separação entre microfone e leitura;
- botão único `Ouvir/Parar`;
- velocidade visível;
- folha de ajustes;
- seletor pt-BR simplificado;
- remoção visual de ações duplicadas;
- publicação PWA;
- preservação da Fase 23.

## Evidências

```yaml
head_funcional: b71faba8be832fd3c2829c14d3a1eef1be807596
workflow: 30819290411
job: 91704807145
testes: 131
aprovados: 131
falhas: 0
segredos: PASS
deployment: dpl_HCZYFQLk7dpdEbt6CD5fA8i5M7zN
deployment_state: READY
root_HTTP: 200
```

## Achados

### Críticos: 0

Nenhum.

### Altos: 0

Nenhum.

### Médios: 2

#### M-01 — posicionamento real da barra no Android

Os testes confirmam reserva de espaço, `safe-area-inset-bottom` e posição acima da navegação. Ainda é necessária validação no mesmo Android para confirmar que a barra não compete com controles do navegador, teclado, acessibilidade flutuante ou navegação inferior da PWA.

#### M-02 — comportamento real da folha e do seletor

A folha utiliza `dialog`, possui fallback por atributo `open` e área rolável. A interação por toque, retorno de foco e apresentação do seletor nativo precisam ser confirmadas no navegador real.

### Baixos: 1

#### L-01 — atualização do estado de leitura por sondagem

O navegador não oferece um evento global confiável para todas as mudanças de `speechSynthesis.speaking`. A barra consulta esse estado a cada 250 ms. O custo é baixo, mas deve ser observado em sessões longas.

## Controles positivos

- a Fase 24A reutiliza os listeners da Fase 23 e não clona o painel;
- o observador do seletor evita reescrita quando o rótulo já está correto;
- o cabeçalho e as ações antigas são ocultados somente no mobile;
- microfone e leitura possuem estados separados;
- o botão de leitura alterna entre ouvir e parar;
- o cache PWA foi renovado;
- a política de microfone continua restrita a `self`;
- 131 testes passaram, incluindo nove testes específicos da Fase 24A.

## Veredito

```yaml
veredito: PASS_WITH_DEVICE_VALIDATION_GATE
critical: 0
high: 0
medium: 2
low: 1
merge: NAO_AUTORIZADO
producao: INTACTA
```

## Gate de dispositivo

1. abrir resultado com uma resposta;
2. confirmar a barra acima da navegação inferior;
3. alternar `Escutar/Desligar`;
4. alternar `Ouvir/Parar`;
5. abrir os ajustes pela velocidade e pelo botão Ajustes;
6. alterar velocidade e voz;
7. fechar pelo botão, pelo gesto do sistema e pelo fundo;
8. confirmar que os botões antigos não aparecem no mobile;
9. confirmar que o final do resultado continua acessível.
