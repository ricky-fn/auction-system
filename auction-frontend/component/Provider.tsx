'use client'

import { SessionProvider } from "next-auth/react";

const Provider = ({ children }: {
  children: React.ReactNode
}) => {
  return <SessionProvider session={null}>{children}</SessionProvider>;
}

export default Provider