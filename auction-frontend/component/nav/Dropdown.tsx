import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { NavLink } from './NavLink'

interface DropdownProps {
  onSignOut: () => void
}

export default function Dropdown({ onSignOut }: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button>
          <img
            className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
            src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Avatar"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1 px-1">
            <Menu.Item>
              {({ active }) => (
                <NavLink href="#" active={active}>
                  Create New Item
                </NavLink>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <NavLink href="#" active={active}>Deposit</NavLink>
              )}
            </Menu.Item>
            <Menu.Item>
              <button
                onClick={onSignOut}
                className='group flex w-full items-center rounded-md text-gray-700 px-4 py-2 text-sm, hover:bg-indigo-500 hover:text-white'>
                Sign out
              </button>
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}