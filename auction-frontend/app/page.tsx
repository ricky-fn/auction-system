import ItemListContainer from "@/component/item/ItemListContainer";
import Nav from "@/component/nav/Nav";
import { requestWithAuth } from "@/lib/utils/request";
import { ApiList } from "auction-shared/api"

export default async function Page() {
  // const { data: result } = await requestWithAuth<ApiList['user']>('https://ddjejmwwrb.execute-api.ap-south-1.amazonaws.com/prod/get-user');
  // console.log(result.user.balance)
  return (
    <div className="min-h-full">
      <Nav />

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <ItemListContainer />
        </div>
      </main>
    </div>
  )
}