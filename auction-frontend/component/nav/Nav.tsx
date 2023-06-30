'use client'
import React, { Fragment } from 'react';
import Dropdown from './Dropdown';
import { useSessionStatus } from '@/lib/users/useSessionStatus';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

const Nav = () => {
  const { isLoggedIn } = useSessionStatus();
  const onSignOut = () => {
    signOut()
  }
  return (
    <div className='w-full h-20 flex justify-between items-center px-8 text-white bg-slate-300'>
      <h1 className='text-2xl font-bold text-[#00df9a]'>REACT.</h1>
      {isLoggedIn
        ? <Dropdown onSignOut={onSignOut} />
        : <Link href="/auth/signin" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">login</Link>}
    </div>
  )
}

export default Nav;