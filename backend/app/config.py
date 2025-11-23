from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    github_token: str
    openai_api_key: str

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
