"""
Database-initialisatie — maakt alle tabellen aan op basis van de SQLAlchemy-modellen.

Dit script wordt automatisch uitgevoerd vóór de start van de API-server (zie Dockerfile).
"""

from src.database import init_db

init_db()
