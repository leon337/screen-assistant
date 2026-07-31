# Estratégia de testes

## Execução automatizada

```bash
npm test
```

A suíte utiliza `node:test` e não depende de bibliotecas externas.

## Cobertura funcional

- respostas HTTP e políticas de API;
- validação de imagem;
- cálculo de redimensionamento;
- presença de câmera e galeria;
- comportamento mobile;
- parser de resposta não JSON;
- Markdown seguro;
- estrutura de respostas;
- PWA e política de cache;
- permissões e cabeçalhos.

## Testes manuais obrigatórios

### Desktop

- compartilhar uma guia ou janela;
- capturar frame;
- encerrar compartilhamento;
- analisar;
- copiar e ouvir;
- confirmar ausência de loop de captura.

### Android

- tirar foto;
- escolher imagem;
- verificar orientação;
- conferir redução de tamanho;
- analisar;
- alternar modo compacto/desktop;
- instalar como PWA quando disponível.

### Falhas

- cancelar seletor de captura;
- negar permissão;
- enviar formato inválido;
- exceder 2 MB após processamento;
- cancelar análise;
- testar cota ou indisponibilidade do modelo;
- confirmar mensagem de erro legível.

## Critério de promoção

Nenhum deployment deve ser considerado aprovado somente porque o build terminou. É necessário:

```text
testes automatizados PASS
+ endpoints 200
+ teste manual de análise real
+ ausência de segredo no frontend
```
