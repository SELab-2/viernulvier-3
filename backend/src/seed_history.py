from sqlalchemy.orm import Session
from src.models.history import History


def seed_history_if_empty(session: Session):
    exists = session.query(History.year, History.language).first()
    if exists:
        print("History already seeded")
        return

    print("Seeding history table...")
    for row in DEFAULT_HISTORY:
        session.add(History(**row))

    session.commit()


DEFAULT_HISTORY = [
    {
        "year": 1910,
        "language": "en",
        "title": "The construction of the Festivities Hall",
        "content": (
            "In 1910 Vooruit bought a big residence and two adjacent houses in the Sint-Pietersnieuwstraat. "
            "This was to become the location for a new festivities hall. With this new cultural temple the "
            "socialists wanted to prove that they were no philistines, and that they cared about the intellectual "
            "development of the workers. The cooperative commissioned Ferdinand Dierkens as architect and the "
            "workers received a colossal House of the People."
        ),
    },
    {
        "year": 1910,
        "language": "nl",
        "title": "De bouw van Feestlokaal Vooruit",
        "content": (
            "In 1910 kocht Vooruit een groot herenhuis en twee aangrenzende woningen in de Sint-Pietersnieuwstraat. "
            "Daar moest een nieuw feestlokaal komen. Met deze cultuurtempel wilden de socialisten bewijzen dat ze "
            "zich bekommerden om de geestelijke ontwikkeling van de arbeiders. De coöperatie stelde Ferdinand "
            "Dierkens aan als architect. De arbeiders kregen een reusachtig volkshuis."
        ),
    },
    {
        "year": 1946,
        "language": "en",
        "title": "The return of the bustle",
        "content": (
            "In 1946 the cooperative regained the Festivities Hall. After the war, associations such as the "
            "Multatulikring, Harmonie Vooruit and the Rode Valken transformed it once again into a lively meeting "
            "place. New associations joined, including Anseele Vrienden, Studiekring Edward Anseele, women’s league "
            "De Samenwerkster and the Leesclub Boekuil."
        ),
    },
    {
        "year": 1946,
        "language": "nl",
        "title": "De heropleving van het Feestlokaal",
        "content": (
            "In 1946 kreeg de coöperatie Vooruit het Feestlokaal terug in handen. Na de oorlog maakten de "
            "Multatulikring, Harmonie Vooruit en de Rode Valken er opnieuw een bijenkorf van. Nieuwe verenigingen "
            "zoals De Samenwerkster, Anseele Vrienden en Leesclub Boekuil sloten zich aan."
        ),
    },
    {
        "year": 1970,
        "language": "en",
        "title": "Decline of the building",
        "content": (
            "Due to lack of funds, more and more spaces fell into disuse. Water leaks and poor fire safety caused "
            "associations to leave the building. By the 1970s, only the café still had some visitors, though its "
            "lively days were long gone."
        ),
    },
    {
        "year": 1970,
        "language": "nl",
        "title": "Het verval van het gebouw",
        "content": (
            "Door geldgebrek raakten steeds meer zalen in onbruik. Waterinsijpeling en gebrekkige brandveiligheid "
            "zorgden ervoor dat verenigingen het gebouw verlieten. In de jaren 1970 was enkel het café nog "
            "enigszins in gebruik."
        ),
    },
    {
        "year": 1980,
        "language": "en",
        "title": "Clean-up and restoration",
        "content": (
            "Across Belgium many Houses of the People were in decline. In 1982 a group of young people founded the "
            "Socio-Cultural Center Vooruit to restore the entire building and turn it into a progressive artistic "
            "meeting place, distancing it from its former political label."
        ),
    },
    {
        "year": 1980,
        "language": "nl",
        "title": "Opruimactie en restauratie",
        "content": (
            "Overal in België verkeerden volkshuizen in verval. In 1982 richtten enkele jongeren de vzw "
            "Socio-cultureel Centrum Vooruit op om het gebouw te restaureren en er een progressief artistiek "
            "ontmoetingscentrum van te maken, los van het vroegere politieke etiket."
        ),
    },
    {
        "year": 1988,
        "language": "en",
        "title": "Kunstencentrum Vooruit",
        "content": (
            "In 1988 the center was renamed Kunstencentrum Vooruit. Artistic policy became the top priority, "
            "focusing on innovative work across disciplines. The building evolved into a workspace for artists "
            "from Belgium and abroad."
        ),
    },
    {
        "year": 1988,
        "language": "nl",
        "title": "Kunstencentrum Vooruit",
        "content": (
            "In 1988 werd het centrum omgedoopt tot Kunstencentrum Vooruit. Het artistieke beleid werd prioritair, "
            "met aandacht voor vernieuwend werk uit verschillende disciplines. Het gebouw werd een werkplaats voor "
            "kunstenaars uit binnen- en buitenland."
        ),
    },
    {
        "year": 2013,
        "language": "en",
        "title": "100 years of Vooruit",
        "content": (
            "With around 100 staff members, 2,000 activities and 350,000 visitors annually, Vooruit became a major "
            "cultural institution. The motto 'Art ennobles' still symbolizes the spirit of the venue."
        ),
    },
    {
        "year": 2013,
        "language": "nl",
        "title": "100 jaar Vooruit",
        "content": (
            "Met ongeveer 100 medewerkers, 2000 activiteiten en 350.000 bezoekers per jaar groeide Vooruit uit tot "
            "een culturele instelling van formaat. Het opschrift 'Kunst veredelt' blijft het motto van het gebouw."
        ),
    },
    {
        "year": 2017,
        "language": "en",
        "title": "A Flemish arts institution",
        "content": (
            "On January 1, 2017, the arts center officially became a Flemish arts institution with a renewed mission "
            "built around six pillars: support, experiment, connect, engage, reflect and celebrate."
        ),
    },
    {
        "year": 2017,
        "language": "nl",
        "title": "Een Vlaamse kunstinstelling",
        "content": (
            "Op 1 januari 2017 werd het kunstencentrum officieel een Vlaamse kunstinstelling met een hernieuwde "
            "missie rond zes speerpunten: support, experiment, connect, engage, reflect en celebrate."
        ),
    },
    {
        "year": 2022,
        "language": "en",
        "title": "A new name: VIERNULVIER",
        "content": (
            "In 2022 Kunstencentrum Vooruit changed its name to Kunstencentrum VIERNULVIER after the socialist party "
            "adopted the name Vooruit. The building itself remains known as De Vooruit."
        ),
    },
    {
        "year": 2022,
        "language": "nl",
        "title": "Een nieuwe naam: VIERNULVIER",
        "content": (
            "In 2022 veranderde Kunstencentrum Vooruit haar naam naar Kunstencentrum VIERNULVIER nadat de "
            "socialistische partij de naam Vooruit aannam. Het gebouw zelf blijft De Vooruit heten."
        ),
    },
]
