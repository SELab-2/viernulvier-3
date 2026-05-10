use std::collections::HashMap;
use sqlx::PgPool;

use crate::errors::AppError;
use crate::worker::converters::{
    event::convert_event, eventprice::convert_event_price, genres::convert_genre,
    production::convert_production,
};
use crate::worker::fetchers::{
    event::fetch_events, eventprice::fetch_event_prices, genres::fetch_genres,
    halls::fetch_halls, production::fetch_productions,
};
use crate::worker::sync::store::{
    event::upsert_event, eventprice::upsert_event_price, genre::upsert_genre_as_tag,
    production::upsert_production,
};
use crate::worker::vnv_wrapper::VnvClient;

pub async fn sync_halls(pool: &PgPool, client: &VnvClient) -> Result<HashMap<i32, i32>, AppError> {
    let vnv_halls = fetch_halls(client).await?;
    let mut vnv_to_db: HashMap<i32, i32> = HashMap::new();

    for hall in vnv_halls {
        let row: (i32,) = sqlx::query_as(
            r#"
            INSERT INTO halls (name, address)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            RETURNING id
            "#,
        )
        .bind(&hall.name)
        .bind(&hall.address)
        .fetch_optional(pool)
        .await
        .map_err(AppError::Database)?
        .unwrap_or_else(|| unreachable!());

        vnv_to_db.insert(hall.id, row.0);
    }
    Ok(vnv_to_db)
}

pub async fn sync_productions(
    pool: &PgPool,
    client: &VnvClient,
) -> Result<HashMap<i32, i32>, AppError> {
    let vnv_prods = fetch_productions(client).await?;
    let mut vnv_to_db: HashMap<i32, i32> = HashMap::new();

    for vnv_prod in vnv_prods {
        let vnv_id = vnv_prod.id;
        let converted = convert_production(vnv_prod);
        let db_id = upsert_production(pool, converted).await?;
        vnv_to_db.insert(vnv_id, db_id);
    }
    Ok(vnv_to_db)
}

pub async fn sync_events(
    pool: &PgPool,
    client: &VnvClient,
    prod_map: &HashMap<i32, i32>,
    hall_map: &HashMap<i32, i32>,
) -> Result<HashMap<i32, i32>, AppError> {
    let vnv_events = fetch_events(client).await?;
    let mut vnv_to_db: HashMap<i32, i32> = HashMap::new();

    for vnv_event in vnv_events {
        let vnv_id = vnv_event.id;
        let production_id = match prod_map.get(&vnv_event.production) {
            Some(id) => *id,
            None => continue,
        };
        let hall_id = vnv_event.hall.and_then(|hid| hall_map.get(&hid).copied());
        let converted = convert_event(vnv_event);
        let db_id = upsert_event(pool, converted, production_id, hall_id).await?;
        vnv_to_db.insert(vnv_id, db_id);
    }
    Ok(vnv_to_db)
}

pub async fn sync_event_prices(
    pool: &PgPool,
    client: &VnvClient,
    event_map: &HashMap<i32, i32>,
) -> Result<(), AppError> {
    let vnv_prices = fetch_event_prices(client).await?;

    for vnv_price in vnv_prices {
        let event_id = match event_map.get(&vnv_price.event) {
            Some(id) => *id,
            None => continue,
        };
        let converted = convert_event_price(vnv_price);
        upsert_event_price(pool, converted, event_id).await?;
    }
    Ok(())
}

pub async fn sync_genres(
    pool: &PgPool,
    client: &VnvClient,
) -> Result<HashMap<i32, i32>, AppError> {
    let vnv_genres = fetch_genres(client).await?;
    let mut vnv_to_db: HashMap<i32, i32> = HashMap::new();

    for vnv_genre in vnv_genres {
        let vnv_id = vnv_genre.id;
        let converted = convert_genre(vnv_genre);
        let tag_id = upsert_genre_as_tag(pool, converted).await?;
        vnv_to_db.insert(vnv_id, tag_id);
    }
    Ok(vnv_to_db)
}
