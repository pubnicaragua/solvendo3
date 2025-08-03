import React from 'react'

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  tabs: {
    id: string
    label: string
  }[]
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  tabs
}) => {
  return (
    <div className="flex mb-6 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2 text-center font-medium ${
            activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}