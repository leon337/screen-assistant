# Origem e visão do projeto

## Ideia inicial

Em 30 de julho de 2026, Leo propôs uma aplicação simples que demonstrasse de forma concreta um agente de IA operando no computador sem depender de uma instalação pesada.

A solicitação original foi pesquisar e propor uma solução **100% em nuvem e gratuita** para um sistema capaz de:

1. capturar a tela do usuário mediante permissão do navegador;
2. enviar a captura para um backend leve;
3. interpretar a imagem com modelos acessíveis por API e camada gratuita;
4. devolver uma resposta em texto ou voz;
5. considerar Vercel, Cloudflare Workers e Supabase;
6. considerar Gemini e GLM;
7. declarar limites reais, riscos e alternativas;
8. priorizar simplicidade e segurança.

## Resultado esperado

O produto deveria provar que um agente visual poderia:

```text
ver uma imagem autorizada
→ compreender o contexto
→ responder a uma pergunta
→ explicar a tela em linguagem natural
```

## Restrições iniciais

- custo inicial zero ou próximo de zero;
- nenhuma chave exposta no navegador;
- nenhuma captura automática;
- permissão explícita do usuário;
- sem persistência desnecessária de imagens;
- arquitetura simples o suficiente para estudo e evolução incremental;
- possibilidade de trocar provedor caso uma cota gratuita falhasse.

## Público inicial

O primeiro usuário e operador do sistema foi o próprio criador do projeto. A aplicação também serve como:

- demonstração educacional de integração multimodal;
- laboratório de arquitetura cloud;
- prova de conceito de agente visual;
- base para futuras automações e assistência contextual.

## Evolução da visão

O escopo cresceu de uma captura desktop para uma aplicação multiplataforma:

```text
captura desktop
→ Gemini real
→ resposta e voz
→ fallback
→ deploy público
→ câmera e galeria
→ experiência mobile-first
→ PWA instalável
```

O projeto atual mantém a essência da ideia original: o usuário escolhe conscientemente o que será analisado, e o processamento acontece em uma infraestrutura leve na nuvem.
