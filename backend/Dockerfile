FROM rust:1.91-slim AS builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
RUN mkdir -p src && echo 'fn main() {}' > src/main.rs && touch src/lib.rs
RUN cargo build --release && rm -f target/release/deps/viernulvier_backend*

COPY . .
RUN touch src/main.rs src/lib.rs && cargo build --release

FROM debian:trixie-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

WORKDIR /app

COPY --from=builder /app/target/release/viernulvier-backend /app/viernulvier-backend
COPY --from=builder /app/migrations /app/migrations

USER appuser
EXPOSE 8000

CMD ["/app/viernulvier-backend"]
