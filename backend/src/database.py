from database import Database

# URL van echte database
DATABASE_URL = "" # TBD

database = Database(DATABASE_URL)


async def get_db():
    return database
