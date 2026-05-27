<script setup lang="ts">
import { computed, ref } from 'vue'
import { getBattleResult, formatPokemonName, type BattleResult } from './utils/battle'
import { getPokemonByName, PokemonNotFoundError, type Pokemon } from './services/pokeApi'

type PokemonSide = 'one' | 'two'

const pokemonOneName = ref('')
const pokemonTwoName = ref('')
const pokemonOne = ref<Pokemon | null>(null)
const pokemonTwo = ref<Pokemon | null>(null)
const pokemonOneError = ref('')
const pokemonTwoError = ref('')
const loadingPokemonOne = ref(false)
const loadingPokemonTwo = ref(false)
const battleResult = ref<BattleResult | null>(null)

const canGetPokemonOne = computed(() => pokemonOneName.value.trim().length >= 3 && !loadingPokemonOne.value)
const canGetPokemonTwo = computed(() => pokemonTwoName.value.trim().length >= 3 && !loadingPokemonTwo.value)
const canBattle = computed(() => Boolean(pokemonOne.value && pokemonTwo.value))

async function loadPokemon(side: PokemonSide) {
  const isPokemonOne = side === 'one'
  const name = isPokemonOne ? pokemonOneName.value : pokemonTwoName.value

  setPokemonError(side, '')
  setPokemon(side, null)
  battleResult.value = null
  setLoading(side, true)

  try {
    const pokemon = await getPokemonByName(name)
    setPokemon(side, pokemon)
  } catch (error) {
    setPokemonError(side, getErrorMessage(error, name))
  } finally {
    setLoading(side, false)
  }
}

function battle() {
  if (!pokemonOne.value || !pokemonTwo.value) return

  battleResult.value = getBattleResult(pokemonOne.value, pokemonTwo.value)
}

function resetBattleResult() {
  battleResult.value = null
}

function setPokemon(side: PokemonSide, pokemon: Pokemon | null) {
  if (side === 'one') {
    pokemonOne.value = pokemon
    return
  }

  pokemonTwo.value = pokemon
}

function setPokemonError(side: PokemonSide, message: string) {
  if (side === 'one') {
    pokemonOneError.value = message
    return
  }

  pokemonTwoError.value = message
}

function setLoading(side: PokemonSide, isLoading: boolean) {
  if (side === 'one') {
    loadingPokemonOne.value = isLoading
    return
  }

  loadingPokemonTwo.value = isLoading
}

function getErrorMessage(error: unknown, requestedName: string) {
  if (error instanceof PokemonNotFoundError) {
    return `Pokemon "${error.pokemonName}" nao foi encontrado.`
  }

  if (error instanceof Error) {
    return error.message
  }

  return `Nao foi possivel buscar "${requestedName.trim()}".`
}
</script>

<template>
  <main class="battle-page">
    <header class="page-header">
      <span class="league-badge">PokéAPI Arena</span>
      <h1>Pokemon Battle</h1>
    </header>

    <section class="battle-layout" aria-label="Pokemon battle simulator">
      <article class="pokemon-panel">
        <div class="panel-header">
          <span class="trainer-label">Treinador 1</span>
          <strong>Pokemon 1</strong>
        </div>

        <label class="field-label" for="pokemon-one">Nome do Pokemon</label>
        <input
          id="pokemon-one"
          v-model="pokemonOneName"
          class="pokemon-input"
          type="text"
          placeholder="ex: pikachu"
          autocomplete="off"
          @input="resetBattleResult"
        />

        <button
          class="action-button"
          type="button"
          :disabled="!canGetPokemonOne"
          @click="loadPokemon('one')"
        >
          {{ loadingPokemonOne ? 'Buscando...' : 'Buscar Pokemon' }}
        </button>

        <p v-if="pokemonOneError" class="error-message">{{ pokemonOneError }}</p>

        <div class="pokemon-image-box">
          <img
            v-if="pokemonOne?.imageUrl"
            :src="pokemonOne.imageUrl"
            :alt="`${formatPokemonName(pokemonOne.name)} image`"
          />
          <span v-else>Imagem do Pokemon</span>
        </div>

        <div v-if="pokemonOne" class="pokemon-summary">
          <strong>{{ formatPokemonName(pokemonOne.name) }}</strong>
          <span>HP: {{ pokemonOne.hp }}</span>
        </div>
      </article>

      <article class="battle-panel">
        <div class="versus-mark">VS</div>

        <button class="battle-button" type="button" :disabled="!canBattle" @click="battle">
          Batalhar
        </button>

        <div class="battle-result-box" :class="{ 'has-result': battleResult }">
          <template v-if="battleResult">
            <h2>{{ battleResult.outcome }}</h2>
            <p>
              {{ formatPokemonName(battleResult.pokemonOne.name) }} HP:
              {{ battleResult.pokemonOne.hp }}
            </p>
            <p>
              {{ formatPokemonName(battleResult.pokemonTwo.name) }} HP:
              {{ battleResult.pokemonTwo.hp }}
            </p>
          </template>
          <span v-else>Resultado da batalha</span>
        </div>
      </article>

      <article class="pokemon-panel">
        <div class="panel-header">
          <span class="trainer-label">Treinador 2</span>
          <strong>Pokemon 2</strong>
        </div>

        <label class="field-label" for="pokemon-two">Nome do Pokemon</label>
        <input
          id="pokemon-two"
          v-model="pokemonTwoName"
          class="pokemon-input"
          type="text"
          placeholder="ex: charizard"
          autocomplete="off"
          @input="resetBattleResult"
        />

        <button
          class="action-button"
          type="button"
          :disabled="!canGetPokemonTwo"
          @click="loadPokemon('two')"
        >
          {{ loadingPokemonTwo ? 'Buscando...' : 'Buscar Pokemon' }}
        </button>

        <p v-if="pokemonTwoError" class="error-message">{{ pokemonTwoError }}</p>

        <div class="pokemon-image-box">
          <img
            v-if="pokemonTwo?.imageUrl"
            :src="pokemonTwo.imageUrl"
            :alt="`${formatPokemonName(pokemonTwo.name)} image`"
          />
          <span v-else>Imagem do Pokemon</span>
        </div>

        <div v-if="pokemonTwo" class="pokemon-summary">
          <strong>{{ formatPokemonName(pokemonTwo.name) }}</strong>
          <span>HP: {{ pokemonTwo.hp }}</span>
        </div>
      </article>
    </section>
  </main>
</template>
