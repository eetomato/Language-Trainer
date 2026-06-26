import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const weekStartDate = process.env.WEEK_START_DATE;
const title = process.env.TITLE;
const situationsJson = process.env.SITUATIONS_JSON;

if (!url || !key) {
  console.error('❌ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が未設定です');
  process.exit(1);
}
if (!weekStartDate || !title || !situationsJson) {
  console.error('❌ WEEK_START_DATE / TITLE / SITUATIONS_JSON が未設定です');
  process.exit(1);
}

let situations;
try {
  situations = JSON.parse(situationsJson);
} catch (e) {
  console.error('❌ SITUATIONS_JSON のパースに失敗しまとした:', e.message);
  process.exit(1);
}

const supabase = createClient(url, key);

console.log(`📅 挿入対象: ${weekStartDate} / ${title}`);
console.log(`📝 situations 件数: ${situations.length}`);

const { error } = await supabase.from('weekly_sheets').insert({
  week_start_date: weekStartDate,
  title,
  is_hidden: false,
  situations,
});

if (error) {
  console.error('❌ 挿入失敗:', error.message);
  process.exit(1);
} else {
  console.log(`✅ 挿入成功: ${weekStartDate} (${title})`);
}
