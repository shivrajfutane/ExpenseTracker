import { JoinGroupClient } from '@/components/groups/JoinGroupClient'

export const dynamic = 'force-dynamic'

export default async function JoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <JoinGroupClient groupId={id} />
    </div>
  )
}
