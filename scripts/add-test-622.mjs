import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const test1 = [
  { sentence: "Shall I put it in your ___?", answer: "bag", hint: "袋" },
  { sentence: "Would you like to combine your ___?", answer: "bags", hint: "袋" },
  { sentence: "Let me put it all in one ___ for you.", answer: "bag", hint: "袋" },
  { sentence: "Please keep your ___ on.", answer: "underwear", hint: "下着" },
  { sentence: "Please wear it over your ___.", answer: "underwear", hint: "下着" },
  { sentence: "Thank you for your ___.", answer: "understanding", hint: "ご理解" },
  { sentence: "It's 100% ___.", answer: "cotton", hint: "コットン" },
  { sentence: "You can ___ wash it.", answer: "machine", hint: "洗濯機" },
  { sentence: "Very easy to ___ for.", answer: "care", hint: "お手入れ" }
];

const test2 = [
  { sentence: "Shall I ___ your bag?", answer: "put it in", hint: "袋に入れる" },
  { sentence: "Would you like to ___ your bags?", answer: "combine", hint: "まとめる" },
  { sentence: "Let me ___ in one bag for you.", answer: "put it all", hint: "全部入れる" },
  { sentence: "Please ___ your underwear on.", answer: "keep", hint: "つけたままにする" },
  { sentence: "Please ___ your underwear.", answer: "wear it over", hint: "〜の上に着る" },
  { sentence: "Thank you ___ your understanding.", answer: "for", hint: "〜に対して" },
  { sentence: "It's ___ cotton.", answer: "100%", hint: "100%" },
  { sentence: "You can ___ it.", answer: "machine wash", hint: "洗濯機で洗う" },
  { sentence: "Very ___ to care for.", answer: "easy", hint: "簡単" }
];

const { error } = await supabase
  .from('weekly_sheets')
  .update({ test1_questions: test1, test2_questions: test2 })
  .eq('week_start_date', '2026-06-22');

if (error) console.error('실패:', error.message);
else console.log('6/22 테스트 문제 추가 완료!');
