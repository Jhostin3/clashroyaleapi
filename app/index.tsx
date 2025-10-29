import React, { useState, useEffect } from 'react';
import { View, Text, Image, ActivityIndicator, SafeAreaView, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import "../global.css";
import { getStatColor, translateStatName } from './utils';

// Interfaz para el tipado de los datos del Pokémon
export interface PokemonType {
  name: string;
  height: number;
  weight: number;
  sprites: {
    other: {
      'official-artwork': {
        front_default: string;
        front_shiny: string;
      };
    };
  };
  types: {
    type: {
      name: string;
    };
  }[];
  stats: {
    base_stat: number;
    stat: {
      name: string;
    };
  }[];
  moves: {
    move: {
      url: string;
    };
  }[];
  detailed_moves: {
    name: string;
    type: {
      name: string;
    };
    power: number | null;
    accuracy: number | null;
  }[];
  cries: {
    latest: string;
  };
}

// Función para obtener el color de fondo según el tipo de Pokémon
const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
        normal: 'bg-gray-400', fire: 'bg-orange-500', water: 'bg-blue-500',
        electric: 'bg-yellow-400', grass: 'bg-green-500', ice: 'bg-cyan-300',
        fighting: 'bg-red-700', poison: 'bg-purple-500', ground: 'bg-amber-700',
        flying: 'bg-indigo-400', psychic: 'bg-pink-500', bug: 'bg-lime-500',
        rock: 'bg-stone-500', ghost: 'bg-indigo-700', dragon: 'bg-violet-600',
        dark: 'bg-gray-800', steel: 'bg-slate-500', fairy: 'bg-pink-300',
    };
    return colors[type] || 'bg-gray-400';
};

// Componente principal de la Pokédex
export default function Pokedex() {
  const [searchQuery, setSearchQuery] = useState('pikachu');
  const [pokemon, setPokemon] = useState<PokemonType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | undefined>();
  const [showShiny, setShowShiny] = useState<boolean>(false);

  // Función asíncrona para obtener los datos del Pokémon
  const obtenerPokemon = async (query: string) => {
    setLoading(true);
    setError(null);
    setPokemon(null);
    setShowShiny(false);

    try {
      const formattedQuery = query.toLowerCase().trim();
      const response = await axios.get<PokemonType>(`https://pokeapi.co/api/v2/pokemon/${formattedQuery}`);
      const data = response.data;

      // Obtiene los detalles de los 4 primeros movimientos
      const movePromises = data.moves.slice(0, 4).map(moveInfo => axios.get(moveInfo.move.url));
      const moveResponses = await Promise.all(movePromises);
      data.detailed_moves = moveResponses.map(res => res.data);

      setPokemon(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(`No se pudo encontrar el Pokémon: "${query}"`);
      } else {
        setError('Ocurrió un error inesperado.');
      }
      console.error('Fallo en la petición tipada:', err);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para obtener el Pokémon inicial al montar el componente
  useEffect(() => {
    obtenerPokemon(searchQuery);
  }, []);

  // Función para manejar la búsqueda
  const handleSearch = () => {
    if (!searchQuery) {
      setError('Ingresa un nombre o ID de Pokémon.');
      return;
    }
    obtenerPokemon(searchQuery);
  };

  // Función para reproducir el grito del Pokémon
  async function playSound() {
    if (!pokemon?.cries?.latest) return;
    const { sound } = await Audio.Sound.createAsync({ uri: pokemon.cries.latest });
    setSound(sound);
    await sound.playAsync();
  }

  // Efecto para descargar el sonido cuando el componente se desmonta
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // Renderiza el contenido principal
  const renderContent = () => {
    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#fbbf24" />
                <Text className="text-white mt-2">Cargando...</Text>
            </View>
        );
    }
    
    if (error) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text className="text-red-500 text-lg">{error}</Text>
            </View>
        );
    }

    if (pokemon) {
      const artwork = showShiny ? pokemon.sprites.other['official-artwork'].front_shiny : pokemon.sprites.other['official-artwork'].front_default;
      return (
        <View className="bg-gray-800 rounded-2xl p-6 items-center shadow-2xl w-11/12 max-w-sm mt-8">
          {/* Imagen del Pokémon */}
          <Image source={{ uri: artwork }} className="w-48 h-48 -mt-24" resizeMode="contain" />

          {/* Botones para shiny y sonido */}
          <View className="flex-row justify-center w-full -mt-4 mb-2">
            <TouchableOpacity onPress={() => setShowShiny(!showShiny)} className="bg-gray-700 p-3 rounded-full mx-2">
                <FontAwesome name="star" size={20} color={showShiny ? '#fbbf24' : 'white'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={playSound} className="bg-gray-700 p-3 rounded-full mx-2">
                <FontAwesome name="volume-up" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Nombre y tipos */}
          <Text className="text-white text-4xl font-bold capitalize mb-2">{pokemon.name}</Text>
          <View className="flex-row mb-4">
            {pokemon.types.map((typeInfo) => (
              <View key={typeInfo.type.name} className={`${getTypeColor(typeInfo.type.name)} rounded-full px-4 py-1 mx-1`}>
                <Text className="text-white font-bold capitalize text-shadow-sm">{typeInfo.type.name}</Text>
              </View>
            ))}
          </View>
          {/* Estadísticas base */}
          <View className="w-full mt-4">
              <Text className="text-white text-2xl font-bold mb-2 text-center">Estadísticas Base</Text>
              {pokemon.stats.map((statInfo) => (
                <View key={statInfo.stat.name} className="flex-row items-center my-1">
                    <Text className="text-gray-400 w-28 capitalize">{translateStatName(statInfo.stat.name)}</Text>
                    <Text className="text-white font-bold w-12 text-right mr-2">{statInfo.base_stat}</Text>
                    <View className="flex-1 bg-gray-600 rounded-full h-4">
                        <View 
                            className={`${getStatColor(statInfo.stat.name)} h-4 rounded-full`}
                            style={{ width: `${(statInfo.base_stat / 255) * 100}%` }}
                        />
                    </View>
                </View>
              ))}
          </View>
          {/* Ataques notables */}
          <View className="w-full mt-6">
              <Text className="text-white text-2xl font-bold mb-3 text-center">Ataques Notables</Text>
              {pokemon.detailed_moves.map((move) => (
                  <View key={move.name} className="bg-gray-700 rounded-lg p-3 mb-2">
                      <View className="flex-row justify-between items-center">
                          <Text className="text-white font-bold text-lg capitalize">{move.name.replace('-', ' ')}</Text>
                          <View className={`${getTypeColor(move.type.name)} rounded-full px-3 py-1`}>
                            <Text className="text-white text-xs font-bold capitalize">{move.type.name}</Text>
                          </View>
                      </View>
                      <View className="flex-row justify-around mt-2 pt-2 border-t border-gray-600">
                          <Text className="text-gray-300">Poder: {move.power || '--'}</Text>
                          <Text className="text-gray-300">Precisión: {move.accuracy || '--'}</Text>
                      </View>
                  </View>
              ))}
          </View>

        </View>
      );
    }
    
    return <Text className="text-gray-500 text-center mt-10">¡Busca un Pokémon para empezar!</Text>;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={{flexGrow: 1, alignItems: 'center'}} className="w-full">
            <Text className="text-5xl font-extrabold text-yellow-400 mt-20 mb-6">Pokédex</Text>
            
            <View className="w-11/12 max-w-sm">
                <TextInput 
                    className="bg-gray-800 border border-gray-700 text-white text-lg rounded-lg p-4 w-full"
                    placeholder="Ingresa Nombre o ID de Pokémon"
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                />
                <TouchableOpacity 
                    onPress={handleSearch}
                    className="bg-yellow-400 rounded-lg py-3 mt-3"
                    disabled={loading}
                >
                    <Text className="text-gray-900 text-xl font-bold text-center">{loading ? 'Buscando...' : 'Buscar'}</Text>
                </TouchableOpacity>
            </View>

            {renderContent()}
        </ScrollView>
    </SafeAreaView>
  );
}
