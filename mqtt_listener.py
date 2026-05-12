import json
import logging
import time
import paho.mqtt.client as mqtt
from app.config import settings
from app.services import bin_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def on_connect(client, userdata, flags, rc, *args, **kwargs):
    """Callback when the client connects to the MQTT broker."""
    if rc == 0:
        logging.info(f"Successfully connected to MQTT Broker at {settings.mqtt_broker_host}:{settings.mqtt_broker_port}")
        # Subscribe to target topic
        client.subscribe(settings.mqtt_topic)
        logging.info(f"Subscribed to topic: '{settings.mqtt_topic}'")
    else:
        logging.error(f"Failed to connect to MQTT broker. Return code: {rc}")


def on_message(client, userdata, msg):
    """Callback when a PUBLISH message is received from the broker."""
    payload_str = msg.payload.decode("utf-8")
    logging.info(f"Received MQTT payload on topic '{msg.topic}': {payload_str}")

    try:
        data = json.loads(payload_str)
        bin_id = data.get("bin_id")
        fill_percentage = data.get("fill_percentage")

        if bin_id is not None and fill_percentage is not None:
            # Process and store into MongoDB using bin_service
            updated_bin = bin_service.update_bin_fill_level(str(bin_id), float(fill_percentage))
            logging.info(f"Updated database state for dustbin '{bin_id}' -> Fill: {fill_percentage}%, Status: {updated_bin.get('status') if updated_bin else 'Unknown'}")
        else:
            logging.warning("Invalid JSON structure: missing 'bin_id' or 'fill_percentage'.")

    except json.JSONDecodeError:
        logging.error(f"Failed to decode JSON payload: {payload_str}")
    except Exception as e:
        logging.error(f"Error processing MQTT message: {str(e)}")


def start_mqtt_listener():
    """Initialize and start the MQTT subscriber loop."""
    # Ensure client compatibility with both paho-mqtt v1 and v2 API
    if hasattr(mqtt, "CallbackAPIVersion"):
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="omnibin_backend_subscriber")
    else:
        client = mqtt.Client(client_id="omnibin_backend_subscriber")

    client.on_connect = on_connect
    client.on_message = on_message

    # Enable TLS for secure cloud broker connection (required by HiveMQ Cloud)
    client.tls_set(tls_version=mqtt.ssl.PROTOCOL_TLS_CLIENT)

    # Authenticate with cloud broker credentials from settings / .env
    if settings.mqtt_username and settings.mqtt_password:
        client.username_pw_set(settings.mqtt_username, settings.mqtt_password)

    logging.info(f"Attempting connection to MQTT broker {settings.mqtt_broker_host}:{settings.mqtt_broker_port}...")

    # Continuous retry loop to handle broker startup delays gracefully
    while True:
        try:
            client.connect(settings.mqtt_broker_host, settings.mqtt_broker_port, keepalive=60)
            break
        except Exception as e:
            logging.warning(f"MQTT Broker unavailable ({str(e)}). Retrying in 5 seconds...")
            time.sleep(5)

    # Start the network loop blocking thread
    try:
        client.loop_forever()
    except KeyboardInterrupt:
        logging.info("Disconnecting MQTT listener...")
        client.disconnect()


if __name__ == "__main__":
    start_mqtt_listener()
