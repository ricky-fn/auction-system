'use client'
import React from 'react';
import { signIn, signOut } from 'next-auth/react';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { User } from 'auction-shared/models';
import NavbarMenu from './NavbarMenu';
import Logo from "@/public/logo.svg"

const userNavigation = [
  { name: 'Create New Item', href: '/protected/create' },
  { name: 'Deposit', href: '/protected/deposit' },
]

const Nav = ({ user }: { user: null | User }) => {
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
                    <img
                      className="w-17"
                      src={Logo.src}
                      alt="Jitera"
                    />
                  </div>
                </div>
                {user ? (
                  <>
                    <div className="hidden md:block">
                      <div className="ml-4 flex items-center md:ml-6">
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
                      <img className="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
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