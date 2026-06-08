export const CLOSING_CATEGORIES = [
  {
    id: 'appreciation',
    category: 'Appreciation',
    intent: '감사',
    description: '매장에 와준 것에 대한 감사. 고객이 환영받았다고 느끼게 한다.',
    color: '#E8F4FD',
    expressions: [
      { text: 'Thanks again.', translation: '감사합니다.', level: 1 },
      { text: 'Thanks for stopping by.', translation: '들러주셔서 감사합니다.', level: 1 },
      { text: 'I appreciate it.', translation: '감사드립니다.', level: 2 },
    ],
  },
  {
    id: 'reassurance',
    category: 'Reassurance',
    intent: '안심 제공',
    description: '고객은 구매 직후 "잘 산 건가?"라는 불안을 가진다. 선택이 옳았음을 확인시켜 준다.',
    color: '#FDF3E8',
    expressions: [
      { text: 'Great choice.', translation: '좋은 선택이셨어요.', level: 1 },
      { text: "You'll enjoy it.", translation: '마음에 드실 거예요.', level: 1 },
      { text: "I think you'll get a lot of wear out of it.", translation: '오래 잘 입으실 수 있을 거예요.', level: 2 },
    ],
  },
  {
    id: 'farewell',
    category: 'Farewell',
    intent: '배웅',
    description: '구매가 아닌 관계를 마무리한다. 고객이 기분 좋게 매장을 나설 수 있게 한다.',
    color: '#F0F8EE',
    expressions: [
      { text: 'Take care.', translation: '안녕히 가세요.', level: 1 },
      { text: 'Have a good one.', translation: '좋은 하루 되세요.', level: 1 },
      { text: 'Enjoy the rest of your day.', translation: '남은 하루도 즐겁게 보내세요.', level: 2 },
    ],
  },
  {
    id: 'revisit',
    category: 'Revisit Invitation',
    intent: '재방문 유도',
    description: '압박 없이 자연스럽게 재방문을 유도한다.',
    color: '#F5F0FA',
    expressions: [
      { text: 'See you next time.', translation: '또 오세요.', level: 1 },
      { text: 'See you soon.', translation: '곧 또 뵙겠습니다.', level: 1 },
      { text: 'Hope to see you again.', translation: '다시 뵐 수 있으면 좋겠습니다.', level: 2 },
    ],
  },
  {
    id: 'product',
    category: 'Product Comment',
    intent: '상품 언급',
    description: '고객이 선택한 상품을 자연스럽게 언급해 만족감을 높인다.',
    color: '#FEF9E7',
    expressions: [
      { text: "That's a great piece.", translation: '정말 좋은 아이템이에요.', level: 1 },
      { text: 'That color suits you really well.', translation: '그 색상이 정말 잘 어울리세요.', level: 2 },
      { text: "It's one of our most popular items.", translation: '저희 매장에서 가장 인기 있는 상품 중 하나예요.', level: 2 },
    ],
  },
];
