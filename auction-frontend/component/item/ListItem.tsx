
export default function ListItem() {
  return (
    <table className="w-full mb-2 text-md">
      <tbody>
        <tr>
          <td className="px-6 py-4 text-left">
            <div className="font-medium text-gray-900">John Doe</div>
          </td>
          <td className="px-6 py-4 text-center">
            <div className="text-gray-900">John Doe</div>
          </td>
          <td className="px-6 py-4 text-center">
            <div className="text-gray-900">John Doe</div>
          </td>
          <td className="px-6 py-4 text-right">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Bid
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  )
}