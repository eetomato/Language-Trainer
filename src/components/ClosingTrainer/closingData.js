export const CLOSING_CATEGORIES = [
  {
    id: 'appreciation',
    category: 'Appreciation',
    intent: '感謝',
    description: 'お客様がご来店くださったことへの感謝。歓迎されていると感じていただく。',
    color: '#E8F4FD',
    expressions: [
      { text: 'Thanks again.', translation: 'ありがとうございます。', level: 1 },
      { text: 'Thanks for stopping by.', translation: 'お立ち寄りいただきありがとうございます。', level: 1 },
      { text: 'I appreciate it.', translation: 'ありがとうございます。', level: 2 },
    ],
  },
  {
    id: 'reassurance',
    category: 'Reassurance',
    intent: '安心感',
    description: 'お客様は購入直後に「本当に良かったのか？」という不安を感じることがある。選択が正しかったと伝える。',
    color: '#FDF3E8',
    expressions: [
      { text: 'Great choice.', translation: '素晴らしい選択です。', level: 1 },
      { text: "You'll enjoy it.", translation: 'きっと気に入っていただけます。', level: 1 },
      { text: "I think you'll get a lot of wear out of it.", translation: '長くお使いいただけると思います。', level: 2 },
    ],
  },
  {
    id: 'farewell',
    category: 'Farewell',
    intent: 'お見送り',
    description: '購入ではなく、関係を締めくくる。お客様が気持ちよくご退店いただけるように。',
    color: '#F0F8EE',
    expressions: [
      { text: 'Take care.', translation: 'お気をつけて。', level: 1 },
      { text: 'Have a good one.', translation: 'よい一日を。', level: 1 },
      { text: 'Enjoy the rest of your day.', translation: '残りの一日もお楽しみください。', level: 2 },
    ],
  },
  {
    id: 'revisit',
    category: 'Revisit Invitation',
    intent: '再来店',
    description: 'プレッシャーをかけずに、自然な形で再来店を促す。',
    color: '#F5F0FA',
    expressions: [
      { text: 'See you next time.', translation: 'またのご来店をお待ちしております。', level: 1 },
      { text: 'See you soon.', translation: 'またお会いしましょう。', level: 1 },
      { text: 'Hope to see you again.', translation: 'またのご来店をお待ちしています。', level: 2 },
    ],
  },
  {
    id: 'product',
    category: 'Product Comment',
    intent: '商品への言及',
    description: 'お客様が選んだ商品に自然に触れることで、満足感を高める。',
    color: '#FEF9E7',
    expressions: [
      { text: "That's a great piece.", translation: '素晴らしいアイテムですね。', level: 1 },
      { text: 'That color suits you really well.', translation: 'その色、とてもお似合いです。', level: 2 },
      { text: "It's one of our most popular items.", translation: '当店で最も人気のある商品の一つです。', level: 2 },
    ],
  },
];
