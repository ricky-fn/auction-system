import { useAppSelector } from '@/lib/hooks/useRedux';
import { classNames } from '@/lib/utils/styles';
import { Dialog, Transition } from '@headlessui/react'
import { Item } from 'auction-shared/models'
import { Fragment, useState } from 'react'

export interface BidModalProps {
  isOpen: boolean
  closeModal: () => void,
  item: Item | null,
  bid: (amount: number) => void,
}

export default function BidModal({ item, isOpen, closeModal, bid }: BidModalProps) {
  const userState = useAppSelector(state => state.user);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);

  const validateAmount = (amount: string): string | null => {
    if (!amount) {
      return 'Amount is required';
    }
    if (Number(amount) <= 0) {
      return 'Amount must be greater than 0';
    }
    if (Number(amount) > userState.balance!) {
      return 'Amount must be less than your balance';
    }
    return null;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    setAmount(value);
    setAmountError(validateAmount(value));
  };

  const onClosing = () => {
    setAmount('');
    setAmountError(null);
    closeModal();
  }

  const onBid = () => {
    const error = validateAmount(amount);
    if (error) {
      setAmountError(error);
      return;
    }

    if (!item) {
      return;
    }
    bid(Number(amount));
    onClosing();
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal} data-cy="bid-modal">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {item && item.name}
                </Dialog.Title>
                <div className="space-y-12">
                  <div className="pb-2">

                    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                      <div className="col-span-full">
                        <label htmlFor="amount" className="block text-sm font-medium leading-6 text-gray-900">
                          Amount
                        </label>
                        <div className="mt-2">
                          <input
                            id="amount"
                            name="amount"
                            type="number"
                            value={amount}
                            onChange={handleInputChange}
                            className={classNames(
                              amountError ? 'bg-red-50 border border-red-500 text-red-900' : 'border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600',
                              "block w-full rounded-md py-1.5 text-gray-900 shadow-sm placeholder:text-gray-400 sm:text-sm sm:leading-6"
                            )}
                            data-cy="bid-amount-input"
                          />
                        </div>
                        {amountError && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-500">{amountError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-x-6">
                  <button type="button" className="text-sm leading-6 text-gray-900" onClick={onClosing}>
                    Cancel
                  </button>
                  <button
                    className="text-sm leading-6 justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onBid}
                    data-cy="bid-button"
                  >
                    Submit
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
