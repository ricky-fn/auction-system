'use client'
import { useEffect, useState } from 'react'
import { Tab } from '@headlessui/react'
import { classNames } from '@/lib/utils/styles'
import ListHeader from './ListHeader'
import ListItem from './ListItem'
import BidModal from '../features/BidItem'
import { axiosInstance as axios } from '@/lib/api/axiosInstance'
import { ApiList } from 'auction-shared/api'
import { Item, Items } from 'auction-shared/models'
import { signIn, useSession } from 'next-auth/react'

type categories = {
  completed: Items,
  ongoing: Items,
}

export default function ItemList() {
  const { status } = useSession();
  let [categories, setCategories] = useState<categories>({
    completed: [],
    ongoing: [],
  })

  let [isOpen, setIsOpen] = useState(false)
  let [selectedItem, setSelectedItem] = useState<Item | null>(null)

  function closeBidModal() {
    setIsOpen(false)
  }

  function openBidModal(item: Item) {
    if (status !== 'authenticated') {
      return signIn('cognito')
    }

    setIsOpen(true)
    setSelectedItem(item)
  }

  useEffect(() => {
    axios.get<ApiList['get-items']>('/get-items').then(({ data }) => {
      const items = data.data
      categories.completed = items.filter((item) => item.status === 'completed')
      categories.ongoing = items.filter((item) => item.status === 'ongoing')
      setCategories(categories)
    })
  }, [])

  return (
    <div className="w-full">
      <BidModal isOpen={isOpen} closeModal={closeBidModal} item={selectedItem} />
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 max-w-md">
          {Object.keys(categories).map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          <ListHeader />
          {Object.values(categories).map((items, idx) => (
            <Tab.Panel
              key={idx}
              className={classNames(
                'rounded-xl bg-white',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
              )}
            >
              {
                items.map((item) => (
                  <ListItem key={item.itemId} onClick={() => openBidModal(item)} item={item} />
                ))
              }
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}
