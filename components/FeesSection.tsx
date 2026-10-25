import { feeFlat, feePercent, naira, serviceFee } from "@/lib/money";

const EXAMPLES = [2000, 5000, 10000, 50000];

/** Plain-English explanation of fees, with worked examples from the live fee settings. */
export function FeesSection() {
  const pct = feePercent();
  const flat = feeFlat();
  return (
    <section className="section" id="fees">
      <div className="two-col">
        <div className="stack">
          <h2 style={{ marginBottom: 0 }}>How fees work</h2>
          <p className="muted">Simple and upfront. The guest sees the exact total before paying.</p>
          <ul className="fee-points">
            <li><strong>Free for hosts.</strong> Creating a celebration and using the spray wall costs nothing.</li>
            <li><strong>Guests pay {pct}% + {naira(flat)}</strong> on top of each spray pack. That&apos;s the Odogwu service fee.</li>
            <li><strong>The celebrant gets 100% of the pack.</strong> A {naira(10000)} pack means {naira(10000)} in their bank.</li>
            <li><strong>Card and bank charges come out of our fee,</strong> never out of the celebrant&apos;s money.</li>
            <li><strong>No hidden fees.</strong> No sign-up fee, no withdrawal fee, no monthly charge.</li>
          </ul>
        </div>
        <div className="panel">
          <table className="fee-table">
            <caption>What a guest pays</caption>
            <thead>
              <tr><th>Spray pack</th><th>Service fee</th><th>Guest pays</th><th>Celebrant gets</th></tr>
            </thead>
            <tbody>
              {EXAMPLES.map((p) => {
                const fee = serviceFee(p, pct, flat);
                return (
                  <tr key={p}>
                    <td>{naira(p)}</td>
                    <td>{naira(fee)}</td>
                    <td><strong>{naira(p + fee)}</strong></td>
                    <td className="gets">{naira(p)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
