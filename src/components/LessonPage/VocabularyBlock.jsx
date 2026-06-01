export default function VocabularyBlock({ vocabulary }) {
  return (
    <section className="lesson-section">
      <div className="section-heading">
        <p className="eyebrow">C. Vocabulary</p>
        <h2>Fit words</h2>
      </div>
      <div className="vocab-table">
        {vocabulary.map((item) => (
          <article key={item.japanese} className="vocab-row">
            <div>
              <strong>{item.japanese}</strong>
              <span>{item.hint}</span>
            </div>
            <p>{item.english}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
