import { createClient } from './supabase-client'

export type LogAction = 
  | 'expense_created' 
  | 'expense_edited' 
  | 'expense_deleted' 
  | 'member_added' 
  | 'member_removed' 
  | 'split_updated'
  | 'settlement_added'

interface ActivityLogParams {
  userId: string;
  action: LogAction;
  groupId: string;
  expenseId?: string;
  metadata?: any;
  note?: string;
}

export async function logActivity({
  userId,
  action,
  groupId,
  expenseId,
  metadata = {},
  note,
}: ActivityLogParams) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('activity_logs')
    .insert([{
      user_id: userId,
      action,
      group_id: groupId,
      expense_id: expenseId,
      metadata,
      note,
    }])

  if (error) {
    console.error('Error logging activity:', error)
    return { success: false, error }
  }

  return { success: true }
}
