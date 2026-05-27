export interface Pokemon {
  id: number
  name: string
  hp: number
  imageUrl: string
}

interface PokemonApiStat {
  base_stat: number
  stat: {
    name: string
  }
}

interface PokemonApiResponse {
  id: number
  name: string
  sprites: {
    front_default: string | null
    other?: {
      'official-artwork'?: {
        front_default: string | null
      }
    }
  }
  stats: PokemonApiStat[]
}

export class PokemonNotFoundError extends Error {
  constructor(public readonly pokemonName: string) {
    super(`Pokemon "${pokemonName}" was not found.`)
  }
}

export async function getPokemonByName(rawName: string): Promise<Pokemon> {
  const pokemonName = normalizePokemonName(rawName)
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)

  if (response.status === 404) {
    throw new PokemonNotFoundError(pokemonName)
  }

  if (!response.ok) {
    throw new Error('Could not load Pokemon data. Please try again.')
  }

  const data = (await response.json()) as PokemonApiResponse
  const hp = data.stats.find((item) => item.stat.name === 'hp')?.base_stat

  if (typeof hp !== 'number') {
    throw new Error(`Pokemon "${pokemonName}" does not have HP information.`)
  }

  return {
    id: data.id,
    name: data.name,
    hp,
    imageUrl: data.sprites.other?.['official-artwork']?.front_default ?? data.sprites.front_default ?? '',
  }
}

function normalizePokemonName(name: string) {
  return name.trim().toLowerCase()
}
