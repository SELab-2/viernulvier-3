class Languages:
    ENGLISH = "en"
    DUTCH = "nl"

    @classmethod
    def all(cls) -> list[str]:
        return [
            v
            for k, v in vars(cls).items()
            if not k.startswith("_") and isinstance(v, str)
        ]
