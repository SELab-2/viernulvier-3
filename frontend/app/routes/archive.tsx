import Navbar from "~/shared/components/Navbar"
import FilterSidebar from "~/shared/components/FilterSidebar"

export default function Archive() {
  return (
    <div className="flex">
      <title>Archief | VIERNULVIER</title>
	  <FilterSidebar></FilterSidebar>
	  <div>
	    <h1 className="text-3xl font-bold">Archief Pagina</h1>
	  </div>
    </div>
  );
}
