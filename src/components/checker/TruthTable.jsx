// Renders a truth table for a formula.
// vars    : string[]
// rows    : Array<{ assignment: { [name]: boolean }, result: boolean }>
// verdict : 'tautology' | 'contradiction' | 'contingent'
// formulaStr : string — shown as the result column header

const T_CELL = 'T'
const F_CELL = 'F'

export default function TruthTable({ vars, rows, verdict, formulaStr }) {
  return (
    <div className="truth-table-wrap">
      <div className={`verdict-badge verdict-${verdict}`}>
        {verdict === 'tautology'    && 'Tautology — true for every assignment'}
        {verdict === 'contradiction' && 'Contradiction — false for every assignment'}
        {verdict === 'contingent'   && 'Contingent — true for some, false for others'}
      </div>
      <div className="truth-table-scroll">
        <table className="truth-table">
          <thead>
            <tr>
              {vars.map((v) => <th key={v}>{v}</th>)}
              <th className="col-result">{formulaStr}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={row.result ? 'row-true' : 'row-false'}>
                {vars.map((v) => (
                  <td key={v} className={row.assignment[v] ? 'val-true' : 'val-false'}>
                    {row.assignment[v] ? T_CELL : F_CELL}
                  </td>
                ))}
                <td className={`col-result ${row.result ? 'val-true' : 'val-false'}`}>
                  {row.result ? T_CELL : F_CELL}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
