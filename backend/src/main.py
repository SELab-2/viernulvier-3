from fastapi import FastAPI

app = FastAPI(
    title="Viernulvier Archief API",
    root_path="/api",
)


@app.get("/health")
def health_check():
    return {"status": "ok"}