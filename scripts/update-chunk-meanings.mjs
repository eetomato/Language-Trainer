/**
 * 6/22, 6/29 weekly_sheets データ修正スクリプト
 *
 * 【問題】
 * WeeklySheets.jsx の SentenceRow は sentence.chunk (単数文字列) と
 * sentence.chunk_meaning (単数文字列) を期待しているが、
 *   - 6/22: chunk/chunk_meaning なし、situation フィールド名誤り、translation なし
 *   - 6/29: chunk_meanings (オブジェクト) はあるが chunk/chunk_meaning (単数) なし
 *
 * 【修正内容】
 *   - 6/22: situation.situation → situation.title に修正
 *   - 6/22: sentence.chunks[0] → sentence.chunk に追加
 *   - 6/29: sentence.chunks[0] → sentence.chunk に追加
 *   - 6/29: sentence.chunk_meanings[chunk] → sentence.chunk_meaning に追加
 *
 * 【実行方法】(ローカルの .env が必要)
 *   VITE_SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d'=' -f2) \
 *   VITE_SUPABASE_ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d'=' -f2) \
 *   node scripts/update-chunk-meanings.mjs
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY が未設定です');
  process.exit(1);
}

const supabase = createClient(url, key);

// ── 6/22 situations 修正 ─────────────────────────────────────

function fix622Situations(situations) {
  return situations.map((sit) => ({
    // "situation" → "title" フィールド名修正
    title: sit.title || sit.situation || '',
    pattern: sit.pattern || '',
    sentences: (sit.sentences || []).map((s) => {
      const chunk = Array.isArray(s.chunks) ? s.chunks[0] : (s.chunk || '');
      return {
        text: s.text || '',
        translation: s.translation || '',  // 6/22 は translation なし — 空のまま
        chunk,
        chunk_meaning: s.chunk_meaning || '',  // 6/22 は meanings なし — 空のまま
        chunks: s.chunks || (s.text ? s.text.trim().split(/\s+/) : []),
      };
    }),
  }));
}

// ── 6/29 situations 修正 ─────────────────────────────────────

function fix629Situations(situations) {
  return situations.map((sit) => ({
    title: sit.title || sit.situation || '',
    pattern: sit.pattern || '',
    sentences: (sit.sentences || []).map((s) => {
      const chunk = Array.isArray(s.chunks) ? s.chunks[0] : (s.chunk || '');
      const chunkMeaning =
        s.chunk_meaning ||
        (s.chunk_meanings && chunk ? s.chunk_meanings[chunk] : '') ||
        '';
      return {
        text: s.text || '',
        translation: s.translation || '',
        chunk,
        chunk_meaning: chunkMeaning,
        chunks: s.chunks || [],
        chunk_meanings: s.chunk_meanings || {},
      };
    }),
  }));
}

// ── Supabase UPDATE ───────────────────────────────────────────

async function updateSheet(weekStartDate, fixFn) {
  console.log(`\n📅 ${weekStartDate} 取得中...`);

  const { data, error } = await supabase
    .from('weekly_sheets')
    .select('id, situations')
    .eq('week_start_date', weekStartDate)
    .maybeSingle();

  if (error) {
    console.error(`  ❌ 取得失敗: ${error.message}`);
    return;
  }
  if (!data) {
    console.warn(`  ⚠️  ${weekStartDate} のシートが見つかりません (スキップ)`);
    return;
  }

  const fixed = fixFn(data.situations || []);

  // 変更内容をプレビュー表示
  console.log(`  situations 件数: ${fixed.length}`);
  fixed.forEach((sit, si) => {
    console.log(`  [${si}] title="${sit.title}"`);
    sit.sentences.forEach((s, i) => {
      console.log(`       s[${i}] chunk="${s.chunk}" chunk_meaning="${s.chunk_meaning}"`);
    });
  });

  const { error: upErr } = await supabase
    .from('weekly_sheets')
    .update({ situations: fixed })
    .eq('id', data.id);

  if (upErr) {
    console.error(`  ❌ UPDATE失敗: ${upErr.message}`);
  } else {
    console.log(`  ✅ UPDATE成功: ${weekStartDate}`);
  }
}

await updateSheet('2026-06-22', fix622Situations);
await updateSheet('2026-06-29', fix629Situations);

console.log('\n🎉 完了');
