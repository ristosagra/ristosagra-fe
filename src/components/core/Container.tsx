import React from 'react'

interface ContainerProps {
  children?: React.ReactNode;
}

export const Container = ({ children }: ContainerProps) => {
  return (
    <div className="max-w-2xl w-full px-4 py-8 space-y-8">
      {children}
    </div>
  )
}
