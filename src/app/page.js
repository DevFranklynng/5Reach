import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard } from '@/components/dashboard/StatCard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { ActivityList } from '@/components/dashboard/ActivityList';
import { Users, Rocket, Mail, CheckCircle, Eye, MessageCircle, BarChart3, Target } from 'lucide-react';

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Contacts" value="1,234" trend="+12%" trendColor="green" />
          <StatCard icon={Rocket} label="Active Campaigns" value="8" trend="+2" trendColor="green" />
          <StatCard icon={Mail} label="Emails Sent" value="5,678" trend="+15%" trendColor="green" />
          <StatCard icon={CheckCircle} label="Emails Delivered" value="5,432" trend="+14%" trendColor="green" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Eye} label="Emails Opened" value="2,891" trend="+10%" trendColor="green" />
          <StatCard icon={MessageCircle} label="Replies Received" value="456" trend="-5%" trendColor="red" />
          <StatCard icon={BarChart3} label="Open Rate" value="53.2%" trend="+3%" trendColor="green" />
          <StatCard icon={Target} label="Response Rate" value="8.4%" trend="-1%" trendColor="red" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart />
          <ActivityList />
        </div>
      </div>
    </DashboardShell>
  );
}