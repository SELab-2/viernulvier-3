from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# URL van echte database
DATABASE_URL = "" # TBD

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with AsyncSession() as session:
        yield session
