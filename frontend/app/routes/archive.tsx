import { useState } from "react"
import FilterSidebar from "~/shared/components/FilterSidebar"

export default function Archive() {
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("1970-01-01")
  const date = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const [dateTo, setDateTo] =
	  useState(
		  `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedVenues, setSelectedVenues] = useState<string[]>([])
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])

  const toggleMobileFilters = () => {
    setShowFilters(prev => !prev)
  }

  return (
    <div>
      <title>Archief | VIERNULVIER</title>
      <div>
        <h1 className="text-3xl font-bold">Archief Pagina</h1>
      </div>

      <button
        onClick={toggleMobileFilters}
        className="lg:hidden w-full mb-8 py-3 bg-archive-ink/5 dark:bg-archive-ink-dark/5 border border-archive-ink/10 rounded-xl flex items-center justify-center space-x-3 text-xs font-bold uppercase tracking-widest cursor-pointer"
      >
	    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-darkreader-inline-stroke=""><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
        <span>Filteren & Zoeken</span>
      </button>
	  <div className="flex flex-col lg:flex-row gap-5 mb-16 relative items-start">
        <FilterSidebar
			show={showFilters}
			searchQuery={searchQuery}
			setSearchQuery={setSearchQuery}
			dateTo={dateTo}
			setDateTo={setDateTo}
			dateFrom={dateFrom}
			setDateFrom={setDateFrom}
			selectedTags={selectedTags}
			setSelectedTags={setSelectedTags}
			selectedVenues={selectedVenues}
			setSelectedVenues={setSelectedVenues}
			selectedArtists={selectedArtists}
			setSelectedArtists={setSelectedArtists}
		/>
		<div>
          <p>Search: {searchQuery}</p>
          <p>From: {dateFrom} - To: {dateTo}</p>
          <p>Tags: {selectedTags.join(", ")}</p>
          <p>Venues: {selectedVenues.join(", ")}</p>
          <p>Artists: {selectedArtists.join(", ")}</p>
        </div>
	  </div>

    </div>
  )
}
