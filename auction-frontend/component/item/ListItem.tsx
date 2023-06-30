interface ListItemProps {
  onClick: () => void
}

export default function ListItem({ onClick }: ListItemProps) {
  return (
    <table className="relative rounded-md w-full mb-3 text-md hover:bg-gray-100 border-2">
      <tbody>
        <tr>
          <td className="px-6 py-4 text-left w-1/4">
            <div className="font-medium text-gray-900">John Doe</div>
          </td>
          <td className="px-6 py-4 text-center w-1/4">
            <div className="text-gray-900">John Doe</div>
          </td>
          <td className="px-6 py-4 text-center w-1/4">
            <div className="text-gray-900">John Doe</div>
          </td>
          <td className="px-6 py-4 text-right w-1/4">
            <button onClick={onClick} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Bid
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  )
}