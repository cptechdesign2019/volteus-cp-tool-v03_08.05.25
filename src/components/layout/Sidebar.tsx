'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  UserCheck, 
  Package, 
  FolderOpen, 
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Bug
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Quotes', href: '/quotes', icon: FileText },
  { name: 'Customers', href: '/customers', icon: UserCheck },
  { name: 'Product Library', href: '/product-library', icon: Package },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Reporting', href: '/reporting', icon: BarChart3 },
  { name: 'Debug Logs', href: '/debug', icon: Bug },
]

interface SidebarProps {
  userRole?: string
  userEmail?: string
}

export default function Sidebar({ userRole = 'technician', userEmail }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar-container fixed left-0 top-0 z-50 h-full flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-12' : 'w-64'
      }`} style={{ backgroundColor: '#203B56' }}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-white/10 ${
          isCollapsed ? 'p-2' : 'p-4'
        }`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F4B400, #F4B400CC)' }}>
                <span className="text-sm font-bold text-white">V</span>
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">Volteus</h1>
                <p className="text-white/70 text-xs">Clearpoint Technology + Design</p>
              </div>
            </div>
          )}
          
          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight size={20} />
            ) : (
              <ChevronsLeft size={20} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 space-y-2 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center rounded-lg text-sm font-medium transition-colors group ${
                  isActive
                    ? 'text-white bg-clearpoint-amber/20 border-l-4 border-clearpoint-amber'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                } ${isCollapsed ? 'justify-center px-1 py-2' : 'px-3 py-2.5'}`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon 
                  size={isCollapsed ? 18 : 20} 
                  className={`flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className={`border-t border-white/10 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {!isCollapsed && userEmail && (
            <div className="mb-3">
              <p className="text-white text-sm font-medium truncate">{userEmail}</p>
              <p className="text-white/70 text-xs capitalize">{userRole.replace('_', ' ')}</p>
            </div>
          )}
          
          <Link
            href="/logout"
            className={`flex items-center rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors group ${
              isCollapsed ? 'justify-center px-1 py-2' : 'px-3 py-2.5'
            }`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut 
              size={isCollapsed ? 18 : 20} 
              className={`flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`}
            />
            {!isCollapsed && <span>Sign Out</span>}
          </Link>
        </div>
      </div>
    </>
  )
}