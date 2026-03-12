class Languages:
    ENGLISH = "en"
    NEDERLANDS = "nl"

    @classmethod
    def all(cls) -> list[str]:
        return [
            v
            for k, v in vars(cls).items()
            if not k.startswith("_") and isinstance(v, str)
        ]
