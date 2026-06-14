from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    INTERNAL_API_KEY: str = "change-me-in-production"
    PORT: int = 8001

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
