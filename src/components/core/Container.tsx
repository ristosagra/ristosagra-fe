import React from 'react'

interface ContainerProps {
  children?: React.ReactNode;
  otherClass?: string;
}

export const Container = ({ children, otherClass }: ContainerProps) => {
  return (
    <div className={`w-full px-4 py-8 space-y-8 ${otherClass}`}>
      {children}
    </div>
  )
}
