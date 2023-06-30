export default function ListHeader() {
  return (
    <table className="w-full mb-2">
      <thead>
        <tr className="border-b-2">
          <th
            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/4"
            scope="col"
          >
            Name
          </th>
          <th
            className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider w-1/4"
            scope="col"
          >
            Current Price
          </th>
          <th
            className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider w-1/4"
            scope="col"
          >
            Duration
          </th>
          <th
            className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider w-1/4"
            scope="col"
          >
            Bid
          </th>
        </tr>
      </thead>
    </table>
  )
}