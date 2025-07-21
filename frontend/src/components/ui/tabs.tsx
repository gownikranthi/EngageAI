import React, { useState, ReactNode } from 'react';

interface Tab {
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  initialTab?: number;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, initialTab = 0 }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`px-4 py-2 font-medium text-sm rounded-t-md transition-colors duration-150
              ${activeTab === idx
                ? 'bg-background border-b-2 border-primary text-primary'
                : 'bg-transparent text-muted-foreground hover:text-primary'}
            `}
            onClick={() => setActiveTab(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[activeTab]?.content}</div>
    </div>
  );
};
