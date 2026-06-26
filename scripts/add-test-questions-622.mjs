/**
 * 6/22 weekly_sheet に test1_questions / test2_questions を追加するスクリプト
 *
 * 【目的】
 * 現在 6/22 の weekly_sheet に test1_questions / test2_questions フィールドが
 * 存在しないため、Weekly Test の主催選択ロジックが 6/22 をスキップしてしまう。
 * このスクリプトで空配列を挿入し、6/22 が最新週として選択されるようにする。
 * 後で実際の問題を追加する場合はこのスクリプトを編集して再実行すること。
 *
 * 【実行方法】(ローカルの .env が必要)
 *   VITE_SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d'=' -f2) \
 *   VITE_SUPABASE_ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d'=' -f2) \
 *   node scripts/add-test-questions-622.mjs
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が未設定です');
  process.exit(1);
}

const supabase = createClient(url, key);

const WEEK = '2026-06-22';

// ── 実際の問題を追加する場合はここを編集 ──────────────────
// 例:
// const TEST1_QUESTIONS = [
//   { sentence: "Shall I put it in your ___?", answer: "bag", hint: "荷物をまとめるご提案" },
//   { sentence: "Would you like to ___ your bags?", answer: "combine", hint: "" },
// ];
// const TEST2_QUESTIONS = [
//   { sentence: "Please keep your ___ on.", answer: "underwear", hint: "試着のご案内" },
// ];

const TEST1_QUESTIONS = [];  // 後で追加
const TEST2_QUESTIONS = [];  // 後で追加
// ────────────────────────────────────────────────────────────

console.log(`📅 ${WEEK} の weekly_sheet を取得中...`);

const { data, error } = await supabase
  .from('weekly_sheets')
  .select('id, week_start_date')
  .eq('week_start_date', WEEK)
  .maybeSingle();

if (error) {
  console.error('❌ 取得失敗:', error.message);
  process.exit(1);
}
if (!data) {
  console.error(`❌ ${WEEK} のシートが見つかりません`);
  process.exit(1);
}

console.log(`  id: ${data.id}`);
console.log(`  test1_questions: ${TEST1_QUESTIONS.length} 件`);
console.log(`  test2_questions: ${TEST2_QUESTIONS.length} 件`);

const { error: upErr } = await supabase
  .from('weekly_sheets')
  .update({
    test1_questions: TEST1_QUESTIONS,
    test2_questions: TEST2_QUESTIONS,
  })
  .eq('id', data.id);

if (upErr) {
  console.error('❌ UPDATE失敗:', upErr.message);
  process.exit(1);
}

console.log(`✅ UPDATE成功: ${WEEK} に test1/test2_questions を設定しました`);
