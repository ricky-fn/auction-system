import { axiosInstance } from "@/lib/api/axiosInstance"
import { ApiResponseList } from "auction-shared/api"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: 'Jitera | Item Detail'
}

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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Item {item?.name} - {item?.status}</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <div className="border-b border-gray-900/10 pb-12">
              <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="col-span-full">
                  <label htmlFor="about" className="block text-sm font-medium leading-6 text-gray-900">
                    Cover Photo
                  </label>
                  <div className="mt-2">
                    <img src={item?.photo} alt={item?.name} />
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="item-name" className="block text-sm font-medium leading-6 text-gray-900">
                    Name
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="name"
                      id="item-name"
                      defaultValue={item?.name}
                      readOnly
                      className="border-0 ring-1 ring-inset ring-gray-300 block w-full rounded-md py-1.5 text-gray-900 shadow-sm sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="start-price" className="block text-sm font-medium leading-6 text-gray-900">
                    Start Price
                  </label>
                  <div className="mt-2">
                    <input
                      type="number"
                      name="startingPrice"
                      id="start-price"
                      defaultValue={item?.startingPrice}
                      readOnly
                      className="border-0 ring-1 ring-inset ring-gray-300 block w-full rounded-md py-1.5 text-gray-900 shadow-sm sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="col-span-full">
                  <label htmlFor="time-window" className="block text-sm font-medium leading-6 text-gray-900">
                    Time Window
                  </label>
                  <div className="mt-2">
                    <input
                      id="time-window"
                      name="expirationTime"
                      type="text"
                      defaultValue={item?.expirationTime}
                      placeholder="e.g., 1h"
                      className="border-0 ring-1 ring-inset ring-gray-300 block w-full rounded-md py-1.5 text-gray-900 shadow-sm sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="col-span-full">
                  <label htmlFor="about" className="block text-sm font-medium leading-6 text-gray-900">
                    About
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="about"
                      name="about"
                      defaultValue={item?.about}
                      rows={3}
                      readOnly
                      className="border-0 ring-1 ring-inset ring-gray-300 block w-full rounded-md py-1.5 text-gray-900 shadow-sm sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <Link
              href="/"
              type="button"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Back
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}