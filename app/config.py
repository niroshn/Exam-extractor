from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    AI_API_KEY: str = Field(default="", validation_alias="GEMINI_API_KEY")
    AI_MODEL: str = Field(default="gemini-3.7-flash", validation_alias="AI_MODEL")
    MAX_FILE_SIZE_MB: int = Field(default=25, validation_alias="MAX_FILE_SIZE_MB")
    MAX_FILES: int = Field(default=10, validation_alias="MAX_FILES")
    PDF_DPI: int = Field(default=200, validation_alias="PDF_DPI")
    MAX_CONCURRENT_EXTRACTIONS: int = Field(default=5, validation_alias="MAX_CONCURRENT_EXTRACTIONS")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
