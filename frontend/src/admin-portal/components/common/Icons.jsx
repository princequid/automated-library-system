// src/admin-portal/components/common/Icons.jsx
// The single icon system. Every glyph in the admin portal comes through here so
// size/stroke-weight stay consistent - never `import { X } from 'lucide-react'`
// directly in a page or component.
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  Check,
  CircleAlert,
  CircleCheck,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Inbox,
  ServerCrash,
  BookMarked,
  CircleDollarSign,
  PackagePlus,
  UserRound,
  LogOut,
} from 'lucide-react';

const withDefaults = (Icon) => {
  function Wrapped({ size = 18, strokeWidth = 1.75, ...props }) {
    return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" {...props} />;
  }
  Wrapped.displayName = `Icon(${Icon.displayName || Icon.name})`;
  return Wrapped;
};

export const DashboardIcon = withDefaults(LayoutDashboard);
export const CatalogueIcon = withDefaults(BookOpen);
export const MembersIcon = withDefaults(Users);
export const CirculationIcon = withDefaults(ArrowLeftRight);
export const LoansIcon = withDefaults(RefreshCw);
export const OverduesIcon = withDefaults(AlertTriangle);
export const ReportsIcon = withDefaults(BarChart3);
export const StaffIcon = withDefaults(ShieldCheck);
export const MenuIcon = withDefaults(Menu);
export const CloseIcon = withDefaults(X);
export const SunIcon = withDefaults(Sun);
export const MoonIcon = withDefaults(Moon);
export const SearchIcon = withDefaults(Search);
export const BellIcon = withDefaults(Bell);
export const ChevronDownIcon = withDefaults(ChevronDown);
export const ChevronLeftIcon = withDefaults(ChevronLeft);
export const ChevronRightIcon = withDefaults(ChevronRight);
export const ChevronUpIcon = withDefaults(ChevronUp);
export const PlusIcon = withDefaults(Plus);
export const EditIcon = withDefaults(Pencil);
export const DeleteIcon = withDefaults(Trash2);
export const UploadIcon = withDefaults(Upload);
export const DownloadIcon = withDefaults(Download);
export const CheckIcon = withDefaults(Check);
export const ErrorIcon = withDefaults(CircleAlert);
export const SuccessIcon = withDefaults(CircleCheck);
export const InfoIcon = withDefaults(Info);
export const TrendUpIcon = withDefaults(TrendingUp);
export const TrendDownIcon = withDefaults(TrendingDown);
export const FlatIcon = withDefaults(Minus);
export const SpinnerIcon = withDefaults(Loader2);
export const EmptyIcon = withDefaults(Inbox);
export const ServerErrorIcon = withDefaults(ServerCrash);
export const ActiveLoansIcon = withDefaults(BookMarked);
export const FinesIcon = withDefaults(CircleDollarSign);
export const ItemsAddedIcon = withDefaults(PackagePlus);
export const UserIcon = withDefaults(UserRound);
export const LogoutIcon = withDefaults(LogOut);
