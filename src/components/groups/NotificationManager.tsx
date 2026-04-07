'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

interface NotificationManagerProps {
  groupId: string;
  currentUserId: string;
}

export function NotificationManager({ groupId, currentUserId }: NotificationManagerProps) {
  const supabase = createClient()

  useEffect(() => {
    // 1. Request Permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }

    // 2. Subscribe to Realtime Activity
    const channel = supabase
      .channel(`notifications-${groupId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_logs',
        filter: `group_id=eq.${groupId}`
      }, (payload: any) => {
        const newLog = payload.new
        
        // Don't notify the person who made the change
        if (newLog.user_id === currentUserId) return

        if (Notification.permission === 'granted') {
          let title = "Group Activity"
          let body = "Something happened in your group!"

          switch (newLog.action) {
            case 'expense_created':
                title = "New Expense"
                body = `A new bill was added to the group.`
                break
            case 'expense_edited':
                title = "Expense Updated"
                body = `An existing expense details were modified.`
                break
            case 'expense_deleted':
                title = "Expense Removed"
                body = `An expense was deleted from the group.`
                break
          }

          new Notification(title, {
            body,
            icon: '/logo.png' // Use the app logo
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, currentUserId])

  return null // This is a logic-only component
}
