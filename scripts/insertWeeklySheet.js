import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { error } = await supabase.from('weekly_sheets').insert({
  week_start_date: '2026-06-22',
  title: '6/22 週',
  is_hidden: false,
  situations: [
    {
      situation: "お会計 / At the Register — 荷物をまとめるご提案 / Offering to combine bags",
      sentences: [
        { text: "Shall I put it in your bag?", chunks: ["Shall I put it", "in your bag?"] },
        { text: "Would you like to combine your bags?", chunks: ["Would you like", "to combine your bags?"] },
        { text: "Let me put it all in one bag for you.", chunks: ["Let me put it all", "in one bag for you."] }
      ]
    },
    {
      situation: "試着のご案内 / Fitting Room — 下着の上に着用 / Please wear it over your underwear",
      sentences: [
        { text: "Please keep your underwear on.", chunks: ["Please keep", "your underwear on."] },
        { text: "Please wear it over your underwear.", chunks: ["Please wear it", "over your underwear."] },
        { text: "Thank you for your understanding.", chunks: ["Thank you", "for your understanding."] }
      ]
    },
    {
      situation: "素材・お手入れ / Care Instructions — コットン100%・水洗い可 / 100% Cotton, Machine Washable",
      sentences: [
        { text: "It's 100% cotton.", chunks: ["It's", "100% cotton."] },
        { text: "You can machine wash it.", chunks: ["You can", "machine wash it."] },
        { text: "Very easy to care for.", chunks: ["Very easy", "to care for."] }
      ]
    }
  ]
});

if (error) {
  console.error('삽입 실패:', error);
  process.exit(1);
} else {
  console.log('삽입 완료');
}
