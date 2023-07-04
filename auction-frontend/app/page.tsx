import ItemListContainer from "@/component/item/ItemListContainer";
import { axiosInstance } from "@/lib/api/axiosInstance";
import { ApiList } from "auction-shared/api";

export default async function Page() {
  const { data } = await axiosInstance.get<ApiList['get-items']>('/get-items')

  return (
    <div className="min-h-full">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <ItemListContainer items={data.data} />
        </div>
      </main>
    </div>
  )
}