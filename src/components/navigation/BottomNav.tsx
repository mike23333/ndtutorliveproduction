import { useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, SparklesIcon, UserIcon, BarChartIcon } from '../../theme/icons';
import { AppColors } from '../../theme/colors';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center flex-1 py-2 transition-colors"
      style={{
        color: isActive ? AppColors.accent : AppColors.textMuted,
      }}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      icon: <HomeIcon size={24} />,
      label: 'Home',
      path: '/',
      isActive: location.pathname === '/',
    },
    {
      icon: <SparklesIcon size={24} />,
      label: 'Role Play',
      path: '/roleplay',
      isActive: location.pathname === '/roleplay',
    },
    {
      icon: <BarChartIcon size={24} />,
      label: 'Progress',
      path: '/progress',
      isActive: location.pathname.startsWith('/progress'),
    },
    {
      icon: <UserIcon size={24} />,
      label: 'Profile',
      path: '/profile',
      isActive: location.pathname === '/profile',
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center"
      style={{
        backgroundColor: AppColors.bgPrimary,
        borderTop: `1px solid ${AppColors.borderColor}`,
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(64px + env(safe-area-inset-bottom))',
      }}
    >
      {navItems.map((item) => (
        <NavItem
          key={item.path}
          icon={item.icon}
          label={item.label}
          path={item.path}
          isActive={item.isActive}
          onClick={() => navigate(item.path)}
        />
      ))}
    </nav>
  );
}
