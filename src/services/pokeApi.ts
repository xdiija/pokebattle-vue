const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8989/api'

export interface Pokemon {
  name: string
  hp: number
  imageUrl: string
}

interface BackendPokemon {
  name: string
  hp: number
  image: string | null
}

interface BackendBattleResponse {
  pokemon_one: BackendPokemon
  pokemon_two: BackendPokemon
  result: {
    winner: string | null
    message: string
  }
}

interface BackendCacheResponse {
  message: string
}

export interface BattleResult {
  pokemonOne: Pokemon
  pokemonTwo: Pokemon
  outcome: string
  winnerName: string | null
}

export class PokemonNotFoundError extends Error {
  constructor(public readonly pokemonName: string) {
    super(`Pokemon "${pokemonName}" was not found.`)
  }
}

export async function cachePokemons(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/pokemons/cache`)

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, 'Nao foi possivel carregar o cache de Pokemons.'))
  }

  const data = (await response.json()) as BackendCacheResponse

  if (data.message !== 'Pokemons cached successfully.') {
    throw new Error(data.message || 'Nao foi possivel carregar o cache de Pokemons.')
  }

  return data.message
}

export async function getPokemonByName(rawName: string): Promise<Pokemon[]> {
  const pokemonName = normalizePokemonName(rawName)
  const response = await fetch(`${API_BASE_URL}/pokemons/${encodeURIComponent(pokemonName)}`)

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, 'Could not load Pokemon data.'))
  }

  const pokemons = (await response.json()) as BackendPokemon[]

  if (pokemons.length === 0) {
    throw new PokemonNotFoundError(pokemonName)
  }

  return pokemons.map(mapPokemon)
}

export async function battlePokemons(pokemonOneName: string, pokemonTwoName: string): Promise<BattleResult> {
  const response = await fetch(`${API_BASE_URL}/pokemons/battle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      pokemon_one: normalizePokemonName(pokemonOneName),
      pokemon_two: normalizePokemonName(pokemonTwoName),
    }),
  })

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, 'Could not run the battle.'))
  }

  const data = (await response.json()) as BackendBattleResponse

  return {
    pokemonOne: mapPokemon(data.pokemon_one),
    pokemonTwo: mapPokemon(data.pokemon_two),
    outcome: getBattleOutcomeMessage(data),
    winnerName: data.result.winner,
  }
}

function mapPokemon(pokemon: BackendPokemon): Pokemon {
  return {
    name: pokemon.name,
    hp: pokemon.hp,
    imageUrl: pokemon.image ?? '',
  }
}

async function getResponseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const data = (await response.json()) as {
      message?: string
      errors?: Record<string, string[]>
    }

    const validationMessage = data.errors ? Object.values(data.errors).flat()[0] : null

    return validationMessage ?? data.message ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

function getBattleOutcomeMessage(data: BackendBattleResponse) {
  if (!data.result.winner) {
    return 'A batalha terminou empatada.'
  }

  const winner = data.result.winner === data.pokemon_one.name ? data.pokemon_one : data.pokemon_two

  return `${formatPokemonName(winner.name)} venceu a batalha com ${winner.hp} HP.`
}

function formatPokemonName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function normalizePokemonName(name: string) {
  return name.trim().toLowerCase()
}
