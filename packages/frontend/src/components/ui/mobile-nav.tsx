import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { Home, Search, Calendar, User, Heart } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  requiresAuth?: boolean
}

const navItems: NavItem[] = [
  {
    icon: <Home className="w-5 h-5" />,
    label: 'Home',
    href: '/',
  },
  {
    icon: <Search className="w-5 h-5" />,
    label: 'Explore',
    href: '/barbershops',
  },
  {
    icon: <Calendar className="w-5 h-5" />,
    label: 'Bookings',
    href: '/my-bookings',
    requiresAuth: true,
  },
  {
    icon: <Heart className="w-5 h-5" />,
    label: 'Favorites',
    href: '/favorites',
    requiresAuth: true,
  },
  {
    icon: <User className="w-5 h-5" />,
    label: 'Profile',
    href: '/profile',
    requiresAuth: true,
  },
]

export function MobileNav() {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()

  // Don't show mobile nav on desktop
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  if (!isMobile) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          // Skip auth-required items if not authenticated
          if (item.requiresAuth && !isAuthenticated) {
            return null
          }

          const isActive = location.pathname === item.href
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200",
                "min-w-[60px] relative group",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <div className={cn(
                "transition-transform duration-200",
                isActive && "scale-110"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-xs font-medium mt-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Hook to detect if mobile nav should adjust content padding
export function useMobileNavPadding() {
  const [shouldPad, setShouldPad] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setShouldPad(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return shouldPad
}

// Floating Action Button for quick booking
export function FloatingActionButton() {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  
  // Don't show on certain pages
  const hiddenPaths = ['/book', '/login', '/register']
  if (hiddenPaths.includes(location.pathname)) return null

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-40">
      <Link to="/book">
        <button className="w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group active:scale-95">
          <Calendar className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </Link>
    </div>
  )
}

// Mobile-optimized page wrapper
interface MobilePageWrapperProps {
  children: React.ReactNode
  className?: string
}

export function MobilePageWrapper({ children, className }: MobilePageWrapperProps) {
  const shouldPad = useMobileNavPadding()
  
  return (
    <div className={cn(
      className,
      shouldPad && "pb-20" // Add bottom padding for mobile nav
    )}>
      {children}
    </div>
  )
}