import { classNames } from "@/lib/utils/styles";
import { Menu, Transition } from "@headlessui/react";
import { User } from "auction-shared/models";
import { Fragment } from "react";

interface Props {
  user: User,
  signOut: () => void,
  userNavigation: { name: string, href: string }[]
}

export default function NavbarMenu({ signOut, userNavigation, user }: Props) {
  return (
    <Menu as="div" className="relative ml-3">
      <Menu.Button className="flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
        <span className="sr-only">Open user menu</span>
        <img className="h-10 w-10 rounded-full" src={user.picture} />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="block text-sm text-gray-900 dark:text-white">{user.given_name} {user.family_name}</span>
            <span className="block text-sm  text-gray-500 truncate dark:text-gray-400">{user.email}</span>
          </div>
          {userNavigation.map((item) => (
            <Menu.Item key={item.name}>
              {({ active }) => (
                <a
                  href={item.href}
                  className={classNames(
                    active ? 'bg-gray-100' : '',
                    'block px-4 py-2 text-sm text-gray-700'
                  )}
                >
                  {item.name}
                </a>
              )}
            </Menu.Item>
          ))}
          <Menu.Item>
            <button
              onClick={signOut}
              className="d-block w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}