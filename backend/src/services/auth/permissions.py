"""
Centraal overzicht van alle permissies in de applicatie.

Gebruik deze constanten in plaats van ruwe strings, zodat typos
bij compilatie al opvallen en autocomplete werkt.
"""


class Permissions:
    # Archive
    ARCHIVE_CREATE = "archive:create"
    ARCHIVE_UPDATE = "archive:update"
    ARCHIVE_DELETE = "archive:delete"

    # History
    HISTORY_CREATE = "history:create"
    HISTORY_UPDATE = "history:update"
    HISTORY_DELETE = "history:delete"

    # Users
    USERS_READ = "users:read"
    USERS_CREATE = "users:create"
    USERS_UPDATE = "users:update"
    USERS_DELETE = "users:delete"

    # Blog
    BLOG_CREATE = "blog:create"
    BLOG_UPDATE = "blog:update"
    BLOG_DELETE = "blog:delete"

    @classmethod
    def all(cls) -> list[str]:
        """Return een lijst van alle permissies gedefinieerd in deze klasse."""
        return [
            v
            for k, v in vars(cls).items()
            if not k.startswith("_") and isinstance(v, str)
        ]
