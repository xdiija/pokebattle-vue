# Poke Battle Frontend

Interface em Vue para buscar Pokemons, escolher dois competidores e exibir o resultado de uma batalha calculada pela API Laravel.

O frontend nao consulta mais a PokeAPI diretamente. Ele usa o backend do projeto para carregar o cache de Pokemons, buscar opcoes por nome e executar a batalha.

## Tecnologias

- Vue 3: interface reativa com Composition API.
- TypeScript: tipagem dos dados vindos da API.
- Vite: servidor de desenvolvimento e build.
- Laravel API: fonte dos dados usados na busca e na batalha.

## Como rodar

Acesse a pasta do frontend:

```sh
cd front
```

Instale as dependencias:

```sh
npm install
```

Suba o servidor de desenvolvimento:

```sh
npm run dev
```

Por padrao, a aplicacao fica disponivel em:

```txt
http://localhost:5173
```

## Configuracao da API

Por padrao, o frontend espera que a API Laravel esteja em:

```txt
http://localhost:8989/api
```

Para usar outra URL, crie um arquivo `.env` na pasta `front`:

```env
VITE_API_BASE_URL=http://localhost:8989/api
```

Se o Vite iniciar em uma porta diferente, atualize tambem o `FRONTEND_URLS` no `.env` do backend para evitar bloqueio de CORS.

## Fluxo da aplicacao

- Ao carregar a tela, o frontend chama `GET /api/pokemons/cache`.
- Enquanto o cache nao termina com sucesso, os campos de busca ficam desabilitados.
- Ao clicar em "Buscar Pokemon", o frontend chama `GET /api/pokemons/{name}`.
- A resposta pode trazer nenhum, um ou varios Pokemons.
- Os resultados sao exibidos em ordem alfabetica, com nome e imagem.
- O usuario escolhe um Pokemon da lista para cada treinador.
- Ao clicar em "Batalhar", o frontend chama `POST /api/pokemons/battle`.
- O resultado da batalha e exibido em PT-BR.

## Scripts

Rodar em desenvolvimento:

```sh
npm run dev
```

Checar tipos:

```sh
npm run type-check
```

Gerar build de producao:

```sh
npm run build
```

Visualizar o build:

```sh
npm run preview
```

## Decisoes tecnicas

- `src/services/pokeApi.ts` concentra as chamadas para a API Laravel.
- `App.vue` controla o estado da tela, selecao de Pokemons e exibicao do resultado.
- A mensagem de batalha retornada pelo backend e adaptada no frontend para PT-BR.
