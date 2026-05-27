import type { Pokemon } from '../services/pokeApi'

export interface BattleResult {
  pokemonOne: Pokemon
  pokemonTwo: Pokemon
  outcome: string
  winnerName: string | null
}

export function getBattleResult(pokemonOne: Pokemon, pokemonTwo: Pokemon): BattleResult {
  if (pokemonOne.hp === pokemonTwo.hp) {
    return {
      pokemonOne,
      pokemonTwo,
      outcome: 'Empate! Os dois Pokemons tem o mesmo HP.',
      winnerName: null,
    }
  }

  const winner = pokemonOne.hp > pokemonTwo.hp ? pokemonOne : pokemonTwo

  return {
    pokemonOne,
    pokemonTwo,
    outcome: `${formatPokemonName(winner.name)} venceu a batalha!`,
    winnerName: winner.name,
  }
}

export function formatPokemonName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}
