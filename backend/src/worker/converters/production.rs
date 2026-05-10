use crate::worker::fetchers::production::VnvProduction;

pub struct ConvertedProduction {
    pub viernulvier_id: i32,
    pub performer_type: Option<String>,
    pub attendance_mode: Option<String>,
    pub title_nl: Option<String>,
    pub artist_nl: Option<String>,
    pub tagline_nl: Option<String>,
    pub teaser_nl: Option<String>,
    pub description_nl: Option<String>,
}

pub fn convert_production(vnv: VnvProduction) -> ConvertedProduction {
    ConvertedProduction {
        viernulvier_id: vnv.id,
        performer_type: vnv.performer_type,
        attendance_mode: vnv.attendance_mode,
        title_nl: vnv.title,
        artist_nl: vnv.artist,
        tagline_nl: vnv.tagline,
        teaser_nl: vnv.teaser,
        description_nl: vnv.description,
    }
}
