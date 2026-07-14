// Maps the string icon names stored in lib/permissions.js (JSON-safe) back to
// renderable lucide-react components. Shared by Sidebar.jsx (client) and
// settings/page.js (server) so both render the same icon for the same route.
import {
  LayoutDashboard, Briefcase, Factory, Package, FileText, Tag, BookOpen,
  Images, Building2, Users, Settings, TrendingUp, UserCheck, MessageSquare,
  Handshake, BarChart2, HelpCircle, Shield, Layers, Megaphone, Cog, Palette,
  Heart, Phone, Map, UserCircle, CreditCard,
} from 'lucide-react'

export const NAV_ICONS = {
  LayoutDashboard, Briefcase, Factory, Package, FileText, Tag, BookOpen,
  Images, Building2, Users, Settings, TrendingUp, UserCheck, MessageSquare,
  Handshake, BarChart2, HelpCircle, Shield, Layers, Megaphone, Cog, Palette,
  Heart, Phone, Map, UserCircle, CreditCard,
}
