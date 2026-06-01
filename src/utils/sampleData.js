export const defaultLesson = {
  id: 'size-expression',
  lessonTitle: 'Size Expression',
  topicArea: 'Menswear fit',
  youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  grammarPoint:
    'Korean and Japanese place the predicate at the end. English moves the main meaning earlier: This jacket runs slightly large.',
  vocabulary: [
    { japanese: '大きめ', english: 'oversized', hint: 'slightly large fit' },
    { japanese: '細身', english: 'slim fit', hint: 'narrow silhouette' },
    { japanese: 'ゆったり', english: 'relaxed fit', hint: 'roomy and comfortable' },
    { japanese: '大きい', english: 'big', hint: 'plain size description' },
  ],
  exampleSentences: [
    {
      japanese: 'こちらのジャケットは少し大きめです。',
      korean: '이 재킷은 조금 크게 나온 편입니다.',
      english: 'This jacket runs slightly large.',
    },
    {
      japanese: '少しゆったり目でお召しいただけます。',
      korean: '조금 여유 있게 입으실 수 있습니다.',
      english: 'You can wear it with a slightly relaxed fit.',
    },
    {
      japanese: 'こちらは細身のシルエットです。',
      korean: '이쪽은 슬림한 실루엣입니다.',
      english: 'This has a slim silhouette.',
    },
  ],
  difficultyLevel: 'beginner',
  questions: [
    {
      id: 'q-fill-1',
      questionType: 'fill_blank',
      questionText: 'こちらのジャケットは少し＿＿＿です。',
      blankAnswer: '大きめ',
      context: 'Customer asks for something slightly oversized.',
    },
    {
      id: 'q-match-1',
      questionType: 'match',
      questionText: 'Match the Japanese fit term to English.',
      blankAnswer: '大きめ=oversized|細身=slim fit|ゆったり=relaxed fit',
      context: 'Vocabulary check',
    },
    {
      id: 'q-roleplay-1',
      questionType: 'roleplay',
      questionText: 'Customer: I want something slightly oversized.',
      blankAnswer: 'こちらのジャケットは少し大きめです。',
      context: 'Use the phrase in a service situation.',
    },
  ],
};

export const seedEmployees = [
  { name: 'FUJIMURA', storeName: 'GINZA', score: 92, studyMinutes: 270 },
  { name: 'KIM', storeName: 'GINZA', score: 87, studyMinutes: 225 },
  { name: 'ONISHI', storeName: 'GINZA', score: 78, studyMinutes: 75 },
  { name: 'SAKATA', storeName: 'GINZA', score: 75, studyMinutes: 140 },
  { name: 'AOI', storeName: 'SHIBUYA', score: 79, studyMinutes: 120 },
  { name: 'REN', storeName: 'SHINJUKU', score: 82, studyMinutes: 95 },
];
