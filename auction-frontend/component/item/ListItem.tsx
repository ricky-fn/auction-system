import { classNames } from "@/lib/utils/styles"
import { Item } from "auction-shared/models"

interface ListItemProps {
  onClick: () => void
  item: Item
}

export default function ListItem({ onClick, item }: ListItemProps) {
  return (
    <table className="relative rounded-md w-full mb-3 text-md hover:bg-gray-100 border-2">
      <tbody>
        <tr>
          <td className="px-6 py-4 text-left w-1/4">
            <div className="font-medium text-gray-900">{item.name}</div>
          </td>
          <td className="px-6 py-4 text-center w-1/4">
            <div className="text-gray-900">{item.highestBid || item.startingPrice}</div>
          </td>
          <td className="px-6 py-4 text-center w-1/4">
            <div className="text-gray-900">{item.expirationTime}</div>
          </td>
          <td className="px-6 py-4 text-right w-1/4">
            <button
              className={classNames(
                "bg-blue-500 text-white font-bold py-2 px-4 rounded",
                item.status === "completed" ? "opacity-50" : "hover:bg-blue-700"
              )}
              onClick={onClick}
              disabled={item.status === "completed"}
            >
              Bid
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  )
}