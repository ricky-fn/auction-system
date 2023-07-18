import { axiosInstance } from "@/lib/api/axiosInstance"
import { ApiResponseList } from "auction-shared/api"

export default async function Page({ params }: { params: { itemId: string } }) {
  const { data: { data: item } } = await axiosInstance.get<ApiResponseList['get-item-by-id']>('/get-item-by-id', {
    params: {
      itemId: params.itemId
    }
  })

  return (
    <div className="min-h-full">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Item {item?.name}</h1>
        </div>
      </header>
      <main>
        <img src={item!.photo} />
      </main>
    </div>
  )
}