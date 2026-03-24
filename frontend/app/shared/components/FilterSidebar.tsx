import React, { useState } from "react"

const FilterSidebar: React.FC = () => {
	const [activeTag, setActiveTag] = useState<string[]>([])
	const [tagOpen, setTagOpen] = useState(true)
	const [artistQuery, setArtistQuery] = useState("")
	const [selectedArtists, setSelectedArtists] = useState<string[]>([])

	const toggleTag = (tag: string) => {
		setActiveTag(prev =>
			prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
		)
	}

	const selectArtist = (artist: string) => {
		if (!selectedArtists.includes(artist)) {
			setSelectedArtists(prev => [...prev, artist])
		}
		setArtistQuery("")
	}

	const removeArtist = (artist: string) => {
		setSelectedArtists(prev => prev.filter(a => a !== artist))
	}

	const tags = [
		"Archief", "Atmosfeer", "Beeldende Kunst", "Cinema", "Cultuur",
		"Debat", "Drama", "Gent", "Geschiedenis", "Kennis", "Live",
		"Lokaal", "Mockup", "Muziek", "Open Huis", "Performance",
		"Underground", "Visueel"
	]

	const venues = ["Balzaal", "Café", "Domzaal", "Filmzaal", "Theaterzaal"]

	const artists = [
		"Alain Platel", "Anne Teresa De Keersmaeker", "FC Bergman",
		"Jan Decorte", "Josse De Pauw", "Luc Tuymans", "Meg Stuart",
		"Needcompany", "Ontroerend Goed", "Peeping Tom",
		"Sidi Larbi Cherkaoui", "Wim Vandekeybus"
	]

	const filteredArtists = artistQuery.trim().length > 0
		? artists.filter(a =>
			a.toLowerCase().includes(artistQuery.toLowerCase()) &&
			!selectedArtists.includes(a)
		)
		: []

	return (
		<aside id="archive-sidebar" className="hidden lg:block w-full lg:w-80 lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto lg:overflow-y-auto sticky-scroll space-y-6 pr-0 lg:pr-4 mb-10 lg:mb-0">

			<div className="p-6 bg-archive-ink/5 dark:bg-archive-ink-dark/5 rounded-2xl border border-archive-ink/5 dark:border-archive-ink-dark/5 shadow-sm">
				<h3 className="text-xs uppercase tracking-[0.2em] font-bold mb-4 md:mb-6 opacity-40">Zoeken</h3>
				<div className="relative">
					<input type="text" placeholder="Zoek in de collectie" className="archive-filter-input pr-9" />
					<svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 opacity-25 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
			</div>

			<div className="p-6 bg-archive-ink/5 dark:bg-archive-ink-dark/5 rounded-2xl border border-archive-ink/5 dark:border-archive-ink-dark/5 shadow-sm">
				<h3 className="text-xs uppercase tracking-[0.2em] font-bold mb-4 md:mb-6 opacity-40">Periode</h3>
				<div className="grid grid-cols-1 gap-4">
					<div>
						<label className="text-[10px] uppercase tracking-widest opacity-40 block mb-2 font-bold">Van</label>
						<input type="date" defaultValue="1982-01-01" className="archive-filter-input" />
					</div>
					<div>
						<label className="text-[10px] uppercase tracking-widest opacity-40 block mb-2 font-bold">Tot</label>
						<input type="date" defaultValue="2026-12-31" className="archive-filter-input" />
					</div>
				</div>
			</div>

			<div className="p-6 bg-archive-ink/5 dark:bg-archive-ink-dark/5 rounded-2xl border border-archive-ink/5 dark:border-archive-ink-dark/5 shadow-sm">
				<div className="flex justify-between items-center group cursor-pointer mb-6" onClick={() => setTagOpen(prev => !prev)}>
					<h3 className="text-xs uppercase tracking-[0.2em] font-bold opacity-40 cursor-pointer">Tags</h3>
					<svg className={`w-3 h-3 opacity-30 group-hover:opacity-100 transition-transform ${tagOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
					</svg>
				</div>
				{tagOpen && (
					<div className="space-y-4">
						<div className="flex flex-wrap gap-2 max-h-40 md:max-h-60 overflow-y-auto pr-2 sticky-scroll">
							{tags.map(tag => (
								<button
									key={tag}
									onClick={() => toggleTag(tag)}
									className={`px-2 py-1 text-[9px] border rounded transition-all whitespace-nowrap uppercase tracking-wider font-medium ${activeTag.includes(tag) ? "bg-archive-accent border-archive-accent text-white" : "border-archive-ink/10 dark:border-archive-ink-dark/10 hover:border-archive-accent"}`}
								>
									{tag}
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			<div className="p-6 bg-archive-ink/5 dark:bg-archive-ink-dark/5 rounded-2xl border border-archive-ink/5 dark:border-archive-ink-dark/5 shadow-sm">
				<h3 className="text-xs uppercase tracking-[0.2em] font-bold mb-4 md:mb-6 opacity-40">Locatie</h3>
				<div className="space-y-3">
					{venues.map(venue => (
						<label key={venue} className="flex items-center space-x-3 group cursor-pointer">
							<input type="checkbox" className="rounded border-archive-ink/20 text-archive-accent focus:ring-archive-accent" />
							<span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity font-medium">{venue}</span>
						</label>
					))}
				</div>
			</div>

			<div className="p-6 bg-archive-ink/5 dark:bg-archive-ink-dark/5 rounded-2xl border border-archive-ink/5 dark:border-archive-ink-dark/5 shadow-sm">
				<h3 className="text-xs uppercase tracking-[0.2em] font-bold mb-4 md:mb-6 opacity-40">Artiesten</h3>
				<div className="relative">
					<input
						type="text"
						placeholder="Zoek naar artiesten"
						className="archive-filter-input pr-9"
						value={artistQuery}
						onChange={e => setArtistQuery(e.target.value)}
					/>
					<svg className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 opacity-25 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					{filteredArtists.length > 0 && (
						<ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-archive-ink/10 dark:border-archive-ink-dark/10 rounded-xl shadow-lg overflow-hidden">
							{filteredArtists.map(artist => (
								<li
									key={artist}
									onMouseDown={() => selectArtist(artist)}
									className="px-4 py-2 text-[11px] font-medium cursor-pointer hover:bg-archive-accent hover:text-white transition-colors"
								>
									{artist}
								</li>
							))}
						</ul>
					)}
				</div>
				{selectedArtists.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-4">
						{selectedArtists.map(artist => (
							<span
								key={artist}
								className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-archive-accent text-white text-[9px] uppercase tracking-wider font-medium rounded"
							>
								{artist}
								<button
									onClick={() => removeArtist(artist)}
									className="opacity-70 hover:opacity-100 transition-opacity leading-none"
								>
									<svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</span>
						))}
					</div>
				)}
			</div>
		</aside>
	)
}

export default FilterSidebar
