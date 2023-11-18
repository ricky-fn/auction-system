import ItemCreation from "@/component/features/ItemCreation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Auction System | Create Item | Powered By AWS'
}

export default async function CreateItemPage() {

  return (
    <div className="min-h-full">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create Item</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <ItemCreation />
        </div>
      </main>
    </div>
  )
}