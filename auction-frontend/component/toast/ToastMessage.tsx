'use client';

import { hideToast } from "@/store/actions/appActions";
import { RootState } from "@/store/reducers";
import { Transition } from "@headlessui/react";
import { useEffect } from "react";
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { useDispatch, useSelector } from "react-redux";
import { classNames } from "@/lib/utils/styles";
import { ToastVariant } from "@/store/reducers/appReducer";

const variant: Record<ToastVariant, string> = {
  'success': 'text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200',
  'error': 'text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200',
  'warning': 'text-orange-500 bg-orange-100 rounded-lg dark:bg-orange-700 dark:text-orange-200',
}

const ToastIcon = (type: keyof typeof variant) => {
  switch (type) {
    case 'success':
      return CheckIcon
    case 'error':
      return XMarkIcon
    case 'warning':
      return ExclamationTriangleIcon
    default:
      return null;
  }
};

const ToastMessage = () => {
  const appData = useSelector((state: RootState) => state.app)
  const dispatch = useDispatch();

  // useEffect(() => {
  //   if (appData.showToast) {
  //     setTimeout(handleHideToast, 2000)
  //   }
  // }, [appData.showToast])

  const handleHideToast = () => {
    dispatch(hideToast())
  }

  const Icon = ToastIcon(appData.toastType);

  return (
    <Transition
      show={appData.showToast}
      enter="transition-opacity ease-linear duration-200"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity ease-linear duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className="fixed top-20 left-4 flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800"
      >
        <div className={classNames(
          appData.toastType ? variant[appData.toastType] : '',
          "inline-flex items-center justify-center flex-shrink-0 w-8 h-8",
        )}>
          {Icon && <Icon type="error" className="w-5 h-5" />}
        </div>
        <div className="ml-3 text-sm font-normal">{appData.toastMessage}</div>
        <button type="button" className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
          <span className="sr-only">Close</span>
          <XMarkIcon onClick={handleHideToast} />
        </button>
      </div>
    </Transition>
  )
}

export default ToastMessage;