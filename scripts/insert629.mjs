import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { error } = await supabase.from('weekly_sheets').insert({
  week_start_date: '2026-06-29',
  title: '6/29~',
  is_hidden: false,
  situations: [
    {
      title: "声かけ / Approaching Customers",
      pattern: "Feel free to take a look. → This is Japan-exclusive. → Please take a look in the mirror.",
      sentences: [
        { text: "Feel free to take a look.", translation: "ごゆっくりご覧ください。", chunks: ["Feel free", "to take a look."], chunk_meanings: { "Feel free": "遠慮なく〜してください", "to take a look.": "ご覧ください" } },
        { text: "This is Japan-exclusive.", translation: "日本限定です。", chunks: ["This is", "Japan-exclusive."], chunk_meanings: { "This is": "これは", "Japan-exclusive.": "日本限定" } },
        { text: "Please take a look in the mirror.", translation: "鏡でご確認ください。", chunks: ["Please take a look", "in the mirror."], chunk_meanings: { "Please take a look": "ご確認ください", "in the mirror.": "鏡で" } }
      ]
    },
    {
      title: "セール案内 / Sale Information",
      pattern: "Everything is 30% off today. → Sorry, the points event is for members only. → It requires a Japanese account.",
      sentences: [
        { text: "Everything is 30% off today.", translation: "本日は全品30%オフです。", chunks: ["Everything", "is 30% off", "today."], chunk_meanings: { "Everything": "全品", "is 30% off": "30%引き", "today.": "本日" } },
        { text: "Sorry, the points event is for members only.", translation: "申し訳ありませんが、ポイントイベントは会員様限定です。", chunks: ["Sorry,", "the points event", "is for members only."], chunk_meanings: { "Sorry,": "申し訳ありません", "the points event": "ポイントイベントは", "is for members only.": "会員限定です" } },
        { text: "It requires a Japanese account.", translation: "日本のアカウントが必要です。", chunks: ["It requires", "a Japanese account."], chunk_meanings: { "It requires": "必要なのは", "a Japanese account.": "日本のアカウント" } }
      ]
    },
    {
      title: "お荷物・お待ちの案内 / Luggage & Waiting",
      pattern: "Please leave your bags here. → You can set your bags down here. → Please have a seat.",
      sentences: [
        { text: "Please leave your bags here.", translation: "お荷物はこちらにどうぞ。", chunks: ["Please leave", "your bags", "here."], chunk_meanings: { "Please leave": "置いてください", "your bags": "お荷物を", "here.": "こちらに" } },
        { text: "You can set your bags down here.", translation: "こちらに荷物を置いていただけます。", chunks: ["You can", "set your bags down", "here."], chunk_meanings: { "You can": "できます", "set your bags down": "荷物を置く", "here.": "こちらに" } },
        { text: "Please have a seat.", translation: "お座りください。", chunks: ["Please", "have a seat."], chunk_meanings: { "Please": "どうぞ", "have a seat.": "お座りください" } }
      ]
    }
  ]
});

if (error) console.error('실패:', error.message);
else console.log('6/29 데이터 삽입 완료!');
