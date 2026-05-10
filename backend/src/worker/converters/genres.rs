use crate::worker::fetchers::genres::VnvGenre;

pub struct ConvertedGenre {
    pub viernulvier_id: i32,
    pub name: Option<String>,
}

pub fn convert_genre(vnv: VnvGenre) -> ConvertedGenre {
    ConvertedGenre {
        viernulvier_id: vnv.id,
        name: vnv.name,
    }
}
