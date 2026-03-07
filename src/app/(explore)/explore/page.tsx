import { ExploreTabs } from '@/components/explore/explore-tabs'

export default function ExplorePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-sm font-bold uppercase tracking-[0.2em]">Archives</h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
          Browse the research database
        </p>
      </div>
      <ExploreTabs />
    </div>
  )
}
