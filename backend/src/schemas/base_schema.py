from pydantic import BaseModel, ConfigDict, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def strip_trailing_slashes(self):
        for field_name, value in self.__dict__.items():
            if (
                field_name.endswith("_url")
                and isinstance(value, str)
                and value.endswith("/")
            ):
                setattr(self, field_name, value.rstrip("/"))

        return self
