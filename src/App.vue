<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatPokemonName } from './utils/battle'
import {
  battlePokemons,
  cachePokemons,
  getPokemonByName,
  PokemonNotFoundError,
  type BattleResult,
  type Pokemon,
} from './services/pokeApi'

type PokemonSide = 'one' | 'two'

const pokemonOneName = ref('')
const pokemonTwoName = ref('')
const pokemonOne = ref<Pokemon | null>(null)
const pokemonTwo = ref<Pokemon | null>(null)
const pokemonOneOptions = ref<Pokemon[]>([])
const pokemonTwoOptions = ref<Pokemon[]>([])
const pokemonOneError = ref('')
const pokemonTwoError = ref('')
const loadingPokemonOne = ref(false)
const loadingPokemonTwo = ref(false)
const loadingBattle = ref(false)
const loadingCache = ref(true)
const cacheReady = ref(false)
const cacheError = ref('')
const battleError = ref('')
const battleResult = ref<BattleResult | null>(null)

const canGetPokemonOne = computed(
  () => cacheReady.value && pokemonOneName.value.trim().length >= 3 && !loadingPokemonOne.value,
)
const canGetPokemonTwo = computed(
  () => cacheReady.value && pokemonTwoName.value.trim().length >= 3 && !loadingPokemonTwo.value,
)
const canBattle = computed(() => Boolean(pokemonOne.value && pokemonTwo.value && !loadingBattle.value))

onMounted(() => {
  loadPokemonCache()
})

async function loadPokemonCache() {
  loadingCache.value = true
  cacheReady.value = false
  cacheError.value = ''
  resetPokemonSearch()

  try {
    await cachePokemons()
    cacheReady.value = true
  } catch (error) {
    cacheError.value = getErrorMessage(error, 'cache')
  } finally {
    loadingCache.value = false
  }
}

async function loadPokemon(side: PokemonSide) {
  const isPokemonOne = side === 'one'
  const name = isPokemonOne ? pokemonOneName.value : pokemonTwoName.value

  setPokemonError(side, '')
  setPokemon(side, null)
  setPokemonOptions(side, [])
  battleResult.value = null
  battleError.value = ''
  setLoading(side, true)

  try {
    const pokemons = await getPokemonByName(name)
    setPokemonOptions(side, pokemons)
  } catch (error) {
    setPokemonError(side, getErrorMessage(error, name))
  } finally {
    setLoading(side, false)
  }
}

async function battle() {
  if (!pokemonOne.value || !pokemonTwo.value) return

  battleError.value = ''
  battleResult.value = null
  loadingBattle.value = true

  try {
    const result = await battlePokemons(pokemonOne.value.name, pokemonTwo.value.name)
    battleResult.value = result
    pokemonOne.value = result.pokemonOne
    pokemonTwo.value = result.pokemonTwo
  } catch (error) {
    battleError.value = getErrorMessage(error, 'battle')
  } finally {
    loadingBattle.value = false
  }
}

function resetBattleResult() {
  battleResult.value = null
  battleError.value = ''
}

function resetPokemonSearch() {
  pokemonOne.value = null
  pokemonTwo.value = null
  pokemonOneOptions.value = []
  pokemonTwoOptions.value = []
  pokemonOneError.value = ''
  pokemonTwoError.value = ''
  battleResult.value = null
  battleError.value = ''
}

function handleSearchInput(side: PokemonSide) {
  resetBattleResult()
  setPokemon(side, null)
  setPokemonOptions(side, [])
  setPokemonError(side, '')
}

function selectPokemon(side: PokemonSide, pokemon: Pokemon) {
  setPokemon(side, pokemon)
  setPokemonOptions(side, [])
  setPokemonError(side, '')
  resetBattleResult()

  if (side === 'one') {
    pokemonOneName.value = pokemon.name
    return
  }

  pokemonTwoName.value = pokemon.name
}

function setPokemon(side: PokemonSide, pokemon: Pokemon | null) {
  if (side === 'one') {
    pokemonOne.value = pokemon
    return
  }

  pokemonTwo.value = pokemon
}

function setPokemonOptions(side: PokemonSide, pokemons: Pokemon[]) {
  const sortedPokemons = [...pokemons].sort((pokemonA, pokemonB) =>
    pokemonA.name.localeCompare(pokemonB.name),
  )

  if (side === 'one') {
    pokemonOneOptions.value = sortedPokemons
    return
  }

  pokemonTwoOptions.value = sortedPokemons
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
      <h1>Pokemon Battle</h1>
    </header>

    <section v-if="!cacheReady" class="cache-status" aria-live="polite">
      <strong>{{ loadingCache ? 'Preparando busca de Pokemons...' : 'Nao foi possivel preparar a busca.' }}</strong>
      <span v-if="loadingCache">Carregando cache do servidor.</span>
      <span v-else>{{ cacheError }}</span>
      <button v-if="!loadingCache" class="cache-retry-button" type="button" @click="loadPokemonCache">
        Tentar novamente
      </button>
    </section>

    <section class="battle-layout" aria-label="Pokemon battle simulator">
      <article class="pokemon-panel">
        <div class="panel-header">
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
          :disabled="!cacheReady"
          @input="handleSearchInput('one')"
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

        <div v-if="pokemonOneOptions.length" class="pokemon-options" aria-label="Pokemons encontrados">
          <button
            v-for="pokemon in pokemonOneOptions"
            :key="pokemon.name"
            class="pokemon-option"
            :class="{ selected: pokemonOne?.name === pokemon.name }"
            type="button"
            @click="selectPokemon('one', pokemon)"
          >
            <img v-if="pokemon.imageUrl" :src="pokemon.imageUrl" :alt="`${formatPokemonName(pokemon.name)} thumbnail`" />
            <span v-else class="pokemon-option-placeholder"></span>
            <strong>{{ formatPokemonName(pokemon.name) }}</strong>
          </button>
        </div>

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
          {{ loadingBattle ? 'Batalhando...' : 'Batalhar' }}
        </button>

        <p v-if="battleError" class="battle-error">{{ battleError }}</p>

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
          :disabled="!cacheReady"
          @input="handleSearchInput('two')"
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

        <div v-if="pokemonTwoOptions.length" class="pokemon-options" aria-label="Pokemons encontrados">
          <button
            v-for="pokemon in pokemonTwoOptions"
            :key="pokemon.name"
            class="pokemon-option"
            :class="{ selected: pokemonTwo?.name === pokemon.name }"
            type="button"
            @click="selectPokemon('two', pokemon)"
          >
            <img v-if="pokemon.imageUrl" :src="pokemon.imageUrl" :alt="`${formatPokemonName(pokemon.name)} thumbnail`" />
            <span v-else class="pokemon-option-placeholder"></span>
            <strong>{{ formatPokemonName(pokemon.name) }}</strong>
          </button>
        </div>

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
