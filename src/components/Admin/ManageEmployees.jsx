export default function ManageEmployees({ employees }) {
  return (
    <section className="dashboard-band">
      <div className="section-heading">
        <p className="eyebrow">People</p>
        <h2>Employee ranking</h2>
      </div>
      <div className="ranking-list">
        {employees.map((employee, index) => (
          <p key={`${employee.name}-${employee.storeName}`}>
            <span>{index + 1}. {employee.name}</span>
            <strong>{employee.score}%</strong>
          </p>
        ))}
      </div>
    </section>
  );
}
