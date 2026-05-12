from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Notice the %40 replacing the @ in the password
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

settings = Settings()
