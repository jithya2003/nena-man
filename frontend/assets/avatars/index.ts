import { CharacterAvatarId } from '@/types';

export const CHARACTER_AVATAR_SOURCES: Record<CharacterAvatarId, any> = {
  lion: require('./lion.png'),
  elephant: require('./elephant.png'),
  owl: require('./owl.png'),
  rabbit: require('./rabbit.png'),
};

export interface CharacterAvatarItem {
  id: CharacterAvatarId;
  nameKey: string;
  defaultName: string;
  source: any;
  color: string;
}

export const CHARACTER_AVATAR_LIST: CharacterAvatarItem[] = [
  {
    id: 'lion',
    nameKey: 'profile.avatar.lion',
    defaultName: 'සිංහ පැටියා',
    source: CHARACTER_AVATAR_SOURCES.lion,
    color: '#FEF08A',
  },
  {
    id: 'elephant',
    nameKey: 'profile.avatar.elephant',
    defaultName: 'අලි පැටියා',
    source: CHARACTER_AVATAR_SOURCES.elephant,
    color: '#CCFBF1',
  },
  {
    id: 'owl',
    nameKey: 'profile.avatar.owl',
    defaultName: 'බකමූණු යාළුවා',
    source: CHARACTER_AVATAR_SOURCES.owl,
    color: '#E0E7FF',
  },
  {
    id: 'rabbit',
    nameKey: 'profile.avatar.rabbit',
    defaultName: 'හාවා යාළුවා',
    source: CHARACTER_AVATAR_SOURCES.rabbit,
    color: '#FFE4E6',
  },
];
