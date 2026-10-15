export type M3SkillCategory =
    | 'letter_recognition'
    | 'phonics'
    | 'word_building'
    | 'sentence_reading'
    | 'comprehension';

export type M3DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface ActivityRegistryEntry {
    id: string;
    internalQuestionId: number;
    nameSi: string;
    nameEn: string;
    skillCategory: M3SkillCategory;
    difficultyLevel: M3DifficultyLevel;
    targetStimulus: string;
    clinicalTarget: string;
    route: '/(child)/quiz-letter' | '/(child)/quiz-word';
}

export const ACTIVITY_REGISTRY: Record<string, ActivityRegistryEntry> = {
    quiz_l_01: {
        id: 'quiz_l_01',
        internalQuestionId: 1,
        nameSi: 'ස්වර හඳුනාගැනීම',
        nameEn: 'Vowel Recognition',
        skillCategory: 'letter_recognition',
        difficultyLevel: 1,
        targetStimulus: 'අ',
        clinicalTarget: 'Short vowel recognition',
        route: '/(child)/quiz-letter',
    },
    quiz_l_02: {
        id: 'quiz_l_02',
        internalQuestionId: 2,
        nameSi: 'අක්ෂර ශබ්ද විභේදනය',
        nameEn: 'Letter Sound Discrimination',
        skillCategory: 'phonics',
        difficultyLevel: 1,
        targetStimulus: 'ක',
        clinicalTarget: 'ක and ග sound discrimination',
        route: '/(child)/quiz-letter',
    },
    quiz_l_03: {
        id: 'quiz_l_03',
        internalQuestionId: 3,
        nameSi: 'වටකුරු අකුරු හඳුනාගැනීම',
        nameEn: 'Letter Shape Recognition',
        skillCategory: 'letter_recognition',
        difficultyLevel: 1,
        targetStimulus: 'ම',
        clinicalTarget: 'Visual letter shape discrimination',
        route: '/(child)/quiz-letter',
    },
    quiz_l_04: {
        id: 'quiz_l_04',
        internalQuestionId: 4,
        nameSi: 'වක්‍ර අකුරු හඳුනාගැනීම',
        nameEn: 'Curved Letter Recognition',
        skillCategory: 'letter_recognition',
        difficultyLevel: 1,
        targetStimulus: 'ර',
        clinicalTarget: 'Letter shape discrimination',
        route: '/(child)/quiz-letter',
    },
    quiz_l_05: {
        id: 'quiz_l_05',
        internalQuestionId: 5,
        nameSi: 'ඌෂ්ම අක්ෂර විභේදනය',
        nameEn: 'Sibilant Sound Discrimination',
        skillCategory: 'phonics',
        difficultyLevel: 2,
        targetStimulus: 'ස',
        clinicalTarget: 'ස, හ and ශ sound discrimination',
        route: '/(child)/quiz-letter',
    },
    quiz_w_01: {
        id: 'quiz_w_01',
        internalQuestionId: 1,
        nameSi: 'මල හඳුනාගැනීම',
        nameEn: 'Flower Word Matching',
        skillCategory: 'word_building',
        difficultyLevel: 1,
        targetStimulus: 'මල',
        clinicalTarget: 'Basic word recognition',
        route: '/(child)/quiz-word',
    },
    quiz_w_02: {
        id: 'quiz_w_02',
        internalQuestionId: 2,
        nameSi: 'ගස හඳුනාගැනීම',
        nameEn: 'Tree Word Matching',
        skillCategory: 'word_building',
        difficultyLevel: 1,
        targetStimulus: 'ගස',
        clinicalTarget: 'Basic word recognition',
        route: '/(child)/quiz-word',
    },
    quiz_w_03: {
        id: 'quiz_w_03',
        internalQuestionId: 3,
        nameSi: 'පිල්ලම් සහිත වචන',
        nameEn: 'Diacritic Word Recognition',
        skillCategory: 'word_building',
        difficultyLevel: 2,
        targetStimulus: 'මාළු',
        clinicalTarget: 'Pillam decoding',
        route: '/(child)/quiz-word',
    },
    quiz_w_04: {
        id: 'quiz_w_04',
        internalQuestionId: 4,
        nameSi: 'කොම්බුව සහිත වචන',
        nameEn: 'Kombuwa Word Recognition',
        skillCategory: 'word_building',
        difficultyLevel: 2,
        targetStimulus: 'පොත',
        clinicalTarget: 'Kombuwa and diacritic recognition',
        route: '/(child)/quiz-word',
    },
    quiz_w_05: {
        id: 'quiz_w_05',
        internalQuestionId: 5,
        nameSi: 'ස්වර වචන හඳුනාගැනීම',
        nameEn: 'Vowel Word Recognition',
        skillCategory: 'word_building',
        difficultyLevel: 1,
        targetStimulus: 'ඉර',
        clinicalTarget: 'Initial vowel word recognition',
        route: '/(child)/quiz-word',
    },
};