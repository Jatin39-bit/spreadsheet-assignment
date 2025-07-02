import { useState } from 'react';

interface Tab {
  id: string;
  name: string;
  count?: number;
}

export default function FooterTabs() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'all', name: 'All Orders', count: 127 },
    { id: 'pending', name: 'Pending', count: 23 },
    { id: 'reviewed', name: 'Reviewed', count: 45 },
    { id: 'arrived', name: 'Arrived', count: 12 }
  ]);
  const [activeTabId, setActiveTabId] = useState('all');

  const handleTabClick = (tabId: string, tabName: string) => {
    setActiveTabId(tabId);
    console.log(`Tab clicked: ${tabName} (${tabId})`);
    
    // Simulate filtering data based on tab
    switch (tabId) {
      case 'all':
        alert('Showing all orders (127 items)');
        break;
      case 'pending':
        alert('Filtering to show only pending orders (23 items)');
        break;
      case 'reviewed':
        alert('Filtering to show only reviewed orders (45 items)');
        break;
      case 'arrived':
        alert('Filtering to show only arrived orders (12 items)');
        break;
      default:
        alert(`Showing ${tabName} orders`);
        break;
    }
  };

  const handleAddTab = () => {
    console.log('Add new tab clicked');
    const tabName = prompt('Enter new tab name:');
    
    if (tabName && tabName.trim()) {
      const newTab: Tab = {
        id: `tab-${Date.now()}`,
        name: tabName.trim(),
        count: 0
      };
      
      setTabs([...tabs, newTab]);
      setActiveTabId(newTab.id);
      alert(`New tab "${tabName}" created successfully!`);
    }
  };

  const handleTabRightClick = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    
    if (tabs.length <= 1) {
      alert('Cannot delete the last tab');
      return;
    }
    
    const tabToDelete = tabs.find(tab => tab.id === tabId);
    if (tabToDelete && confirm(`Delete tab "${tabToDelete.name}"?`)) {
      const newTabs = tabs.filter(tab => tab.id !== tabId);
      setTabs(newTabs);
      
      // If deleted tab was active, switch to first tab
      if (activeTabId === tabId) {
        setActiveTabId(newTabs[0].id);
      }
      
      console.log(`Tab deleted: ${tabToDelete.name}`);
      alert(`Tab "${tabToDelete.name}" deleted`);
    }
  };

  const handleTabDoubleClick = (tabId: string) => {
    const currentTab = tabs.find(tab => tab.id === tabId);
    if (!currentTab) return;
    
    const newName = prompt('Rename tab:', currentTab.name);
    if (newName && newName.trim() && newName !== currentTab.name) {
      setTabs(tabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, name: newName.trim() }
          : tab
      ));
      console.log(`Tab renamed: ${currentTab.name} -> ${newName}`);
      alert(`Tab renamed to "${newName}"`);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 mt-auto">
      <div className="flex items-center overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id, tab.name)}
            onContextMenu={(e) => handleTabRightClick(e, tab.id)}
            onDoubleClick={() => handleTabDoubleClick(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTabId === tab.id
                ? "border-green-500 text-green-600 bg-green-50 shadow-sm"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
            title={`${tab.name}${tab.count ? ` (${tab.count} items)` : ''}\nRight-click to delete, double-click to rename`}
          >
            <span>{tab.name}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTabId === tab.id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
        
        <button 
          onClick={handleAddTab}
          className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors ml-2"
          title="Add new tab"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        {/* Tab management options */}
        <div className="flex items-center ml-auto pr-4">
          <button
            onClick={() => {
              const tabNames = tabs.map(tab => `${tab.name}${tab.count ? ` (${tab.count})` : ''}`).join('\n');
              alert(`Current tabs:\n\n${tabNames}\n\nTip: Right-click tabs to delete, double-click to rename`);
            }}
            className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            title="Tab management"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}