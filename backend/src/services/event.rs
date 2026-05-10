use sqlx::PgPool;

use crate::errors::AppError;
use crate::models::event::{Event, EventPrice};
use crate::schemas::event::{EventCreate, EventListQuery, EventPriceResponse, EventResponse};

fn to_event_response(event: Event, prices: Vec<EventPrice>) -> EventResponse {
    EventResponse {
        id: event.id,
        viernulvier_id: event.viernulvier_id,
        production_id: event.production_id,
        hall_id: event.hall_id,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        order_url: event.order_url,
        created_at: event.created_at,
        updated_at: event.updated_at,
        prices: prices
            .into_iter()
            .map(|p| EventPriceResponse {
                id: p.id,
                viernulvier_id: p.viernulvier_id,
                event_id: p.event_id,
                amount: p.amount,
                available: p.available,
                expires_at: p.expires_at,
            })
            .collect(),
    }
}

pub async fn get_events_for_production(
    pool: &PgPool,
    production_id: i32,
) -> Result<Vec<EventResponse>, AppError> {
    let events = sqlx::query_as::<_, Event>(
        "SELECT * FROM events WHERE production_id = $1 ORDER BY starts_at ASC NULLS LAST, id ASC",
    )
    .bind(production_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)?;

    let mut responses = Vec::with_capacity(events.len());
    for event in events {
        let prices = get_prices_for_event(pool, event.id).await?;
        responses.push(to_event_response(event, prices));
    }
    Ok(responses)
}

async fn get_prices_for_event(pool: &PgPool, event_id: i32) -> Result<Vec<EventPrice>, AppError> {
    sqlx::query_as::<_, EventPrice>(
        "SELECT * FROM event_prices WHERE event_id = $1 ORDER BY id",
    )
    .bind(event_id)
    .fetch_all(pool)
    .await
    .map_err(AppError::Database)
}

pub async fn list_events(
    pool: &PgPool,
    query: EventListQuery,
) -> Result<Vec<EventResponse>, AppError> {
    let limit = query.limit.unwrap_or(50).min(200);
    let cursor_id = query.cursor.unwrap_or(0);

    let events = if let Some(prod_id) = query.production_id {
        sqlx::query_as::<_, Event>(
            r#"
            SELECT * FROM events
            WHERE production_id = $1 AND id > $2
            ORDER BY starts_at ASC NULLS LAST, id ASC
            LIMIT $3
            "#,
        )
        .bind(prod_id)
        .bind(cursor_id)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)?
    } else {
        sqlx::query_as::<_, Event>(
            "SELECT * FROM events WHERE id > $1 ORDER BY starts_at ASC NULLS LAST, id ASC LIMIT $2",
        )
        .bind(cursor_id)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(AppError::Database)?
    };

    let mut responses = Vec::with_capacity(events.len());
    for event in events {
        let prices = get_prices_for_event(pool, event.id).await?;
        responses.push(to_event_response(event, prices));
    }
    Ok(responses)
}

pub async fn create_event(
    pool: &PgPool,
    data: EventCreate,
) -> Result<EventResponse, AppError> {
    let event = sqlx::query_as::<_, Event>(
        r#"
        INSERT INTO events (production_id, hall_id, starts_at, ends_at, order_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        "#,
    )
    .bind(data.production_id)
    .bind(data.hall_id)
    .bind(data.starts_at)
    .bind(data.ends_at)
    .bind(&data.order_url)
    .fetch_one(pool)
    .await
    .map_err(AppError::Database)?;

    Ok(to_event_response(event, vec![]))
}
