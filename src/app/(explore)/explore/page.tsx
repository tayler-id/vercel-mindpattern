import { ExploreTabs } from '@/components/explore/explore-tabs'

export default function ExplorePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Explore</h1>
        <p className="text-muted-foreground mt-1">Browse your research database</p>
      </div>
      <ExploreTabs />
    </div>
  )
}
