export const getStatColor = (statName) => {
  switch (statName) {
    case 'hp': return 'bg-green-500';
    case 'attack': return 'bg-red-500';
    case 'defense': return 'bg-blue-500';
    case 'special-attack': return 'bg-red-400';
    case 'special-defense': return 'bg-blue-400';
    case 'speed': return 'bg-yellow-500';
    default: return 'bg-gray-400';
  }
};

export const translateStatName = (statName) => {
  const translations = {
    'hp': 'PS',
    'attack': 'Ataque',
    'defense': 'Defensa',
    'special-attack': 'Ataque Esp.',
    'special-defense': 'Defensa Esp.',
    'speed': 'Velocidad',
  };
  return translations[statName] || statName;
};
