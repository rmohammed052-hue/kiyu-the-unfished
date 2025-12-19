import DashboardSidebar from '../DashboardSidebar';
import { useState } from 'react';

export default function DashboardSidebarExample() {
  const [activeItem, setActiveItem] = useState('dashboard');

  return (
    <div className="h-screen">
      <DashboardSidebar
        role="admin"
        activeItem={activeItem}
        onItemClick={(id) => {
          console.log('Navigation clicked:', id);
          setActiveItem(id);
        }}
        userName="John Doe"
      />
    </div>
  );
}
