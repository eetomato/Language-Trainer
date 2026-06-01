export default function GrammarBox({ grammarPoint }) {
  return (
    <section className="lesson-section">
      <div className="section-heading">
        <p className="eyebrow">B. Structure first</p>
        <h2>Predicate position</h2>
      </div>
      <p className="grammar-note">{grammarPoint}</p>
      <div className="structure-grid">
        <div className="structure-line">
          <span>Japanese</span>
          <strong>こちらのジャケットは 少し 大きめです</strong>
          <mark>meaning at end</mark>
        </div>
        <div className="structure-line">
          <span>Korean</span>
          <strong>이 재킷은 조금 크게 나온 편입니다</strong>
          <mark>meaning at end</mark>
        </div>
        <div className="structure-line english">
          <span>English</span>
          <strong>This jacket runs slightly large</strong>
          <mark>predicate earlier</mark>
        </div>
      </div>
    </section>
  );
}
