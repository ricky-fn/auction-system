'use client';
import { createAuthorizedAxios } from "@/lib/api/axiosInstance";
import { useAppDispatch } from "@/lib/hooks/useRedux";
import { classNames } from "@/lib/utils/styles";
import { setLoading, showToast } from "@/store/actions/appActions";
import { ApiRequestParams, ApiResponseList } from "auction-shared/api";
import { AxiosResponse } from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from 'next/navigation'
import { useState } from "react";

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const validateAmount = (amount: string): string | null => {
    if (!amount) {
      return 'Amount is required';
    }
    if (Number(amount) <= 0) {
      return 'Amount must be greater than 0';
    }
    return null;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;

    setAmount(value);
    const error = validateAmount(value);
    if (error) {
      setAmountError(validateAmount(value));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const error = validateAmount(amount);
    if (error) {
      setAmountError(error);
      return;
    }

    if (!session) {
      return console.error('Session is null');
    }

    try {
      dispatch(setLoading(true))
      const authorizedAxios = createAuthorizedAxios(session!);
      await authorizedAxios.post<
        ApiResponseList['deposit'],
        AxiosResponse<ApiResponseList['deposit']>,
        ApiRequestParams['deposit']
      >('/deposit', {
        amount: Number(amount),
      });

      dispatch(showToast({
        type: 'success',
        message: 'Deposit successfully',
      }))

      router.push('/');
    } catch (error) {
      dispatch(showToast({
        type: 'error',
        message: 'Oops Something Wrong...'
      }))
    }
    dispatch(setLoading(false))
  }

  return (
    <div className="min-h-full">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Deposit</h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">

          <form onSubmit={handleSubmit}>
            <div className="space-y-12">
              <div className="border-b border-gray-900/10 pb-12">

                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
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
                        data-cy="amount-input"
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
              <Link href="/" type="button" className="text-sm font-semibold leading-6 text-gray-900">
                Cancel
              </Link>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                data-cy="deposit-button"
              >
                Deposit
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}