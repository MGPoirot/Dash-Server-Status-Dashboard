import os
import boto3
from dotenv import load_dotenv

load_dotenv(override=True)

AWS_REGION_NAME = os.getenv("AWS_REGION_NAME")
CHAT_MODEL_ID = os.getenv("CHAT_MODEL_ID")
CHAT_INFERENCE_PROFILE_ID_OR_ARN = os.getenv("CHAT_INFERENCE_PROFILE_ID_OR_ARN")

if not AWS_REGION_NAME:
    raise RuntimeError("AWS_REGION_NAME must be set in the environment")

MODEL_ID = CHAT_INFERENCE_PROFILE_ID_OR_ARN or CHAT_MODEL_ID
if not MODEL_ID:
    raise RuntimeError("Set CHAT_MODEL_ID or CHAT_INFERENCE_PROFILE_ID_OR_ARN in the environment")

client = boto3.client("bedrock-runtime", region_name=AWS_REGION_NAME)


class Claude:
    def __init__(self, model_id: str):
        self.model_id = model_id

    def invoke(self, prompt: str) -> str:
        messages = [{"role": "user", "content": [{"text": prompt}]}]
        response = client.converse(modelId=self.model_id, messages=messages)
        return response["output"]["message"]["content"][0]["text"]
    
claude = Claude(MODEL_ID)