'use client'
import { useEffect, useState } from 'react'
import { Tab } from '@headlessui/react'
import { classNames } from '@/lib/utils/styles'
import ListHeader from './ListHeader'
import ListItem from './ListItem'
import BidModal from '../features/BidItem'
import { Item, Items } from 'auction-shared/models'
import { signIn, useSession } from 'next-auth/react'
import { createAuthorizedAxios } from '@/lib/api/axiosInstance'
import { ApiRequestParams, ApiResponseList } from 'auction-shared/api'
import { setLoading, showToast } from '@/store/actions/appActions'
import { AxiosResponse } from 'axios'
import { useRouter, usePathname } from 'next/navigation'
import { useAppDispatch } from '@/lib/hooks/useRedux'

type Categories = {
  completed: Items,
  ongoing: Items,
}

export default function ItemListContainer({ items }: { items: Items }) {
  const dispatch = useAppDispatch();
  const session = useSession();

  const categories: Categories = {
    ongoing: items.filter((item) => item.status === 'ongoing'),
    completed: items.filter((item) => item.status === 'completed'),
  }

  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const router = useRouter();
  const pathname = usePathname()

  const refreshData = () => {
    router.replace(pathname);
  };

  useEffect(() => {
    dispatch(setLoading(false))
  }, [items]);

  const closeBidModal = () => {
    setIsOpen(false)
  }

  const openBidModal = (item: Item) => {
    if (session.status === 'unauthenticated') {
      return signIn('cognito')
    }

    setIsOpen(true)
    setSelectedItem(item)
  }

  const handleBid = async (amount: number) => {

    if (!selectedItem) {
      return;
    }

    if (!amount) {
      return;
    }

    if (!session.data) {
      console.log('session is null')
      return
    }

    dispatch(setLoading(true));
    const authorizedAxios = createAuthorizedAxios(session.data);

    try {
      const { data: { data: totalBidAmount } } = await authorizedAxios.get<
        ApiResponseList['get-total-bid-amount'],
        AxiosResponse<ApiResponseList['get-total-bid-amount']>,
        ApiRequestParams['get-total-bid-amount']
      >('/get-total-bid-amount', {
        params: {
          itemId: selectedItem.itemId,
        }
      })

      const currentPrice = selectedItem.highestBid || selectedItem.startingPrice;
      if (totalBidAmount! + amount <= currentPrice) {
        dispatch(showToast({
          type: 'error',
          message: `Your Bid Must Be Higher Than ${currentPrice - totalBidAmount!}`
        }))
        dispatch(setLoading(false));
        return;
      }

      await authorizedAxios.post<
        ApiResponseList['bid-item'],
        AxiosResponse<ApiResponseList['bid-item']>,
        ApiRequestParams['bid-item']
      >('/bid-item', {
        itemId: selectedItem.itemId,
        bidAmount: amount,
      })
      dispatch(showToast({
        type: 'success',
        message: 'You Have Placed A Bid'
      }))
      refreshData();
    } catch (error) {
      dispatch(showToast({
        type: 'error',
        message: 'Oops Something Wrong...'
      }))
      dispatch(setLoading(false));
    }
  }

  return (
    <div className="w-full">
      <BidModal
        isOpen={isOpen}
        closeModal={closeBidModal}
        item={selectedItem}
        bid={handleBid}
      />
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 max-w-md">
          {Object.keys(categories).map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 ring-white ring-opacity-60 ring-offset-2',
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
                'ring-white ring-opacity-60'
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
