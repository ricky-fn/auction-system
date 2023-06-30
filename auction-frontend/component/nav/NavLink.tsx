import { classNames } from "@/lib/utils/styles";
import Link from "next/link";
import React from "react";

interface NavLinkProps {
  href: string;
  children: React.ReactElement | string;
  active: boolean;
  className?: string
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(({ children, href, active, className }, ref) => (
  <Link
    passHref
    href={href}
    ref={ref}
    className={classNames(
      className ? className : '',
      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
      'block rounded-md px-4 py-2 text-sm, hover:bg-indigo-500 hover:text-white'
    )}>
    {children}
  </Link>
));
