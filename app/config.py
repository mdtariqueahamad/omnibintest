from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "omnibin"

    mqtt_broker_host: str = "b72ae81547ef42a6b60ddf4d5d6d4a9e.s1.eu.hivemq.cloud"
    mqtt_broker_port: int = 8883
    mqtt_topic: str = "omnibin/bins/fill_level"

    mqtt_username: str
    mqtt_password: str

    openrouter_api_key: str

    class Config:
        env_file = ".env"


settings = Settings()
