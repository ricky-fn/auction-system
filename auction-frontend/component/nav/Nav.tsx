'use client'
import React, { useEffect } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { User } from 'auction-shared/models';
import NavbarMenu from './NavbarMenu';
import Link from 'next/link';
import Avatar from './Avatar';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/useRedux';
import { login, logout } from '@/store/actions/userActions';
import Image from 'next/image';

export const userNavigation = [
  { name: 'Create New Item', href: '/protected/create' },
  { name: 'Deposit', href: '/protected/deposit' },
]

const Nav = ({ user }: { user: undefined | User }) => {
  const dispatch = useAppDispatch();
  const userState = useAppSelector(state => state.user);

  useEffect(() => {
    if (user) {
      dispatch(login(user))
    } else {
      dispatch(logout())
    }
  }, [user])

  const handleSignOut = () => {
    if (!user) return
    signOut()
  }
  const handleSignIn = () => {
    if (user) return
    signIn('cognito')
  }
  return (
    <>
      <Disclosure as="nav" className="bg-gray-800">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Link href="/">
                      <Image width="100" height="36" src="https://d0.awsstatic.com/logos/powered-by-aws-white.png" alt="Auction System" />
                    </Link>
                  </div>
                </div>
                {user ? (
                  <>
                    <div className="hidden md:block">
                      <div className="ml-4 flex items-center md:ml-6">
                        <span className="text-white">${userState.balance}</span>
                        <NavbarMenu user={user} signOut={handleSignOut} userNavigation={userNavigation} />
                      </div>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                      {/* Mobile menu button */}
                      <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="sr-only">Open main menu</span>
                        {open ? (
                          <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                        ) : (
                          <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                        )}
                      </Disclosure.Button>
                    </div>
                  </>
                ) : (
                  <button onClick={handleSignIn} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Sign In</button>
                )}
              </div>
            </div>

            {user && (
              <Disclosure.Panel className="md:hidden">
                <div className="border-t border-gray-700 pb-3 pt-4">
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      <Avatar url={user.picture} />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">{user.given_name}</div>
                      <div className="text-sm font-medium leading-none text-gray-400">{user.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 px-2">
                    {userNavigation.map((item) => (
                      <Disclosure.Button
                        key={item.name}
                        as="a"
                        href={item.href}
                        className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}

                    <Disclosure.Button
                      as="button"
                      className="w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </Disclosure.Button>
                  </div>
                </div>
              </Disclosure.Panel>
            )}
          </>
        )}
      </Disclosure>
    </>
  )
}

export default Nav;