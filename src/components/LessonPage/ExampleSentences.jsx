export default function ExampleSentences({ sentences }) {
  return (
    <section className="lesson-section">
      <div className="section-heading">
        <p className="eyebrow">D. Real situation</p>
        <h2>Example sentences</h2>
      </div>
      <div className="sentence-list">
        {sentences.map((sentence) => (
          <article key={sentence.japanese} className="sentence-item">
            <strong>{sentence.japanese}</strong>
            <span>{sentence.korean}</span>
            <p>{sentence.english}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
