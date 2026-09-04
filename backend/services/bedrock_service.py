import os
import json
import boto3
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
MODEL_ID = os.getenv("MODEL_ID", "amazon.nova-micro-v1:0")
AWS_BEARER_TOKEN_BEDROCK = os.getenv("AWS_BEARER_TOKEN_BEDROCK")

# Ensure the bearer token is available in the process environment
# so botocore picks it up automatically for Bedrock authentication
if AWS_BEARER_TOKEN_BEDROCK:
    os.environ.setdefault("AWS_BEARER_TOKEN_BEDROCK", AWS_BEARER_TOKEN_BEDROCK)


def get_bedrock_client():
    """
    Configure and return the Bedrock Runtime client.
    Uses AWS_BEARER_TOKEN_BEDROCK from .env for authentication —
    no AWS CLI credentials or IAM users required.
    """
    region = os.getenv("AWS_REGION") or "us-east-1"
    return boto3.client(
        service_name="bedrock-runtime",
        region_name=region,
    )


def get_ai_recommendation(
    destination: str,
    days: int,
    budget: float,
    travel_style: str,
) -> str:
    """
    Call Amazon Bedrock to generate a travel itinerary recommendation.

    Args:
        destination:  The travel destination (e.g. "Bali, Indonesia").
        days:         Number of days for the trip.
        budget:       Total budget in USD.
        travel_style: Travel style (e.g. "adventure", "relaxation", "cultural").

    Returns:
        The AI-generated itinerary as a plain string.
    """
    prompt = (
        f"You are an experienced travel planner.\n"
        f"Plan a {days}-day itinerary for {destination}.\n"
        f"Budget: USD {budget}\n"
        f"Number of Days: {days}\n"
        f"Travel Style: {travel_style}\n\n"
        f"Please include a structured daily plan with the following EXACT headers for each day:\n"
        f"### Morning\n specifically provide 2-3 morning activities.\n"
        f"### Afternoon\n include recommendations for cultural sites and local experiences.\n"
        f"### Evening\n add suggestions for dinner spots and nightlife.\n\n"
        f"Also include:\n"
        f"- Estimated daily budget breakdown\n"
        f"- Local food recommendations\n"
        f"- Transportation suggestions\n\n"
        f"Format your response as Markdown with headers (##) and bullet lists (-)."
    )

    body = json.dumps({
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt
                    }
                ],
            }
        ],
        "inferenceConfig": {
            "maxTokens": 2048,
            "temperature": 0.7,
        },
    })

    client = get_bedrock_client()
    model_id = os.getenv("MODEL_ID") or MODEL_ID

    response = client.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=body,
    )

    result = json.loads(response["body"].read())

    # Amazon Nova / Converse-compatible response shape
    return result["output"]["message"]["content"][0]["text"]


def generate_conversation_reply(
    messages: list[dict],
    system_prompt: str | None = None,
) -> str:
    """
    Call Amazon Bedrock with a multi-turn conversation history.

    Args:
        messages: List of message objects in Bedrock Nova format:
                  [{"role": "user"|"assistant", "content": [{"text": "..."}]}]
        system_prompt: Optional system instructions.

    Returns:
        The AI response text as string.
    """
    system_text = (
        system_prompt
        or "You are KelanaAI, an expert, polite, and friendly travel assistant. "
        "Help the user plan trips, recommend destinations, suggest activities, and answer travel queries. "
        "Language rule: Always respond in the SAME language used by the user in their messages. "
        "If the user communicates in Indonesian (Bahasa Indonesia), you MUST respond in fluent, natural, and helpful Indonesian. "
        "If the user communicates in English, respond in English. "
        "Maintain context across the entire conversation history and format your answers cleanly using Markdown."
    )

    payload = {
        "messages": messages,
        "system": [
            {
                "text": system_text
            }
        ],
        "inferenceConfig": {
            "maxTokens": 2048,
            "temperature": 0.7,
        },
    }

    body = json.dumps(payload)

    client = get_bedrock_client()
    model_id = os.getenv("MODEL_ID") or MODEL_ID

    response = client.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=body,
    )

    result = json.loads(response["body"].read())
    return result["output"]["message"]["content"][0]["text"]
