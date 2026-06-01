import { formatMinutes } from '../../utils/dataFormatter';

export default function ViewReports({ stats }) {
  return (
    <div className="report-grid">
      <section className="dashboard-band">
        <div className="section-heading">
          <p className="eyebrow">Stores</p>
          <h2>Store comparison</h2>
        </div>
        <div className="store-list">
          {stats.stores.map((store) => (
            <p key={store.storeName}>
              <span>{store.storeName}</span>
              <strong>{store.avgScore}%</strong>
              <small>{store.count} staff</small>
            </p>
          ))}
        </div>
      </section>

      <section className="dashboard-band">
        <div className="section-heading">
          <p className="eyebrow">Analysis</p>
          <h2>Most missed</h2>
        </div>
        <div className="weak-list">
          {stats.weakVocabulary.map((item) => (
            <p key={item.word}>
              <strong>{item.word}</strong>
              <span>{item.count} errors</span>
            </p>
          ))}
        </div>
      </section>

      <section className="dashboard-band">
        <div className="section-heading">
          <p className="eyebrow">Time</p>
          <h2>Study leaderboard</h2>
        </div>
        <div className="ranking-list">
          {stats.studyTime.map((employee) => (
            <p key={`${employee.name}-time`}>
              <span>{employee.name}</span>
              <strong>{formatMinutes(employee.studyMinutes)}</strong>
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
