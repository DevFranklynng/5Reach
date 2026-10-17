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
          <StatCard icon={Users} label="Total Contacts" value="--" />
          <StatCard icon={Rocket} label="Active Campaigns" value="--" />
          <StatCard icon={Mail} label="Emails Sent" value="--" />
          <StatCard icon={CheckCircle} label="Emails Delivered" value="--" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Eye} label="Emails Opened" value="--" />
          <StatCard icon={MessageCircle} label="Replies Received" value="--" />
          <StatCard icon={BarChart3} label="Open Rate" value="--" />
          <StatCard icon={Target} label="Response Rate" value="--" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart />
          <ActivityList activities={[]} />
        </div>
      </div>
    </DashboardShell>
  );
}