'use client';

import React, { useState } from 'react';
import { BookOpen, Menu, Loader2, X } from 'lucide-react';
import ProfileDropdown from '@/components/auth/ProfileDropdown';
import { useUIStore } from '@/store/zustand';
import { useIsMobile } from '@/hooks/useBreakpoint';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import {
  useUnreadCount,
  useListNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { useActiveGenerationJobs, useCancelJob } from '@/hooks/useAIGeneration';
import { GenerationJobType } from '@/gen/mirai/v1/ai_generation_pb';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);
  const isMobile = useIsMobile();
  const [cancelling, setCancelling] = useState(false);

  // Notification hooks (RTK Query / Connect Query)
  const { count: unreadCount } = useUnreadCount();
  const { data: notifications, isLoading: notificationsLoading } = useListNotifications({ limit: 20 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  // Active generation jobs
  const { data: activeJobs, hasActiveJobs, refetch: refetchJobs } = useActiveGenerationJobs();
  const cancelJobMutation = useCancelJob();

  // Get primary job for display
  const primaryJob = activeJobs.find(j => j.type === GenerationJobType.FULL_COURSE)
    || activeJobs.find(j => j.type === GenerationJobType.COURSE_OUTLINE)
    || activeJobs[0];

  const handleCancelJob = async () => {
    if (!primaryJob || cancelling) return;
    if (confirm('Cancel course generation?')) {
      setCancelling(true);
      try {
        await cancelJobMutation.mutate(primaryJob.id);
        await refetchJobs();
      } finally {
        setCancelling(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Hamburger menu (mobile devices only) */}
        {isMobile && (
          <button
            onClick={toggleMobileSidebar}
            className="touch-target flex items-center justify-center p-2 -ml-2 mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 lg:h-6 lg:w-6 text-indigo-600" />
          <span className="text-base lg:text-lg font-semibold text-gray-900">
            {title || 'Mirai'}
          </span>
        </div>

        {/* Active Job, Notifications & Profile */}
        <div className="flex items-center gap-2">
          {/* Active Generation Job Indicator */}
          {hasActiveJobs && primaryJob && (
            <div className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline font-medium">
                {primaryJob.progressPercent || 0}%
              </span>
              <button
                onClick={handleCancelJob}
                disabled={cancelling}
                className="ml-1 p-0.5 rounded-full hover:bg-indigo-200 transition-colors"
                title="Cancel generation"
              >
                {cancelling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {/* Notification Bell with Panel */}
          <div className="relative">
            <NotificationBell unreadCount={unreadCount} />
            <NotificationPanel
              notifications={notifications}
              isLoading={notificationsLoading}
              onMarkAsRead={(ids) => markAsRead.mutate(ids)}
              onMarkAllAsRead={() => markAllAsRead.mutate()}
              onDelete={(id) => deleteNotification.mutate(id)}
            />
          </div>

          {/* Profile Dropdown */}
          <ProfileDropdown isProtectedPage />
        </div>
      </div>
    </header>
  );
}
