import os
import json
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")
KNOWLEDGE_BASE_MODEL_ARN = os.getenv("KNOWLEDGE_BASE_MODEL_ARN")
MODEL_ID = os.getenv("MODEL_ID")


def get_bedrock_agent_runtime_client():
    """bedrock-agent-runtime → Retrieve / RetrieveAndGenerate"""
    return boto3.client(
        service_name="bedrock-agent-runtime",
        region_name=AWS_REGION,
    )


def get_bedrock_runtime_client():
    """bedrock-runtime → InvokeModel (LLM)"""
    return boto3.client(
        service_name="bedrock-runtime",
        region_name=AWS_REGION,
    )


def ask_knowledge_base(question: str) -> dict:
    """
    RAG pipeline — two steps, one endpoint:
      1. Retrieve relevant chunks from the Knowledge Base
      2. Pass chunks + question to the LLM via InvokeModel

    Returns a dict with:
      - answer: the grounded answer string
      - sources: list of S3 URIs from the retrieved documents
    """
    agent_runtime = get_bedrock_agent_runtime_client()

    # Step 1 — Retrieve relevant passages from the Knowledge Base
    # Managed KBs require managedSearchConfiguration (not vectorSearchConfiguration)
    retrieve_response = agent_runtime.retrieve(
        knowledgeBaseId=KNOWLEDGE_BASE_ID,
        retrievalQuery={"text": question},
        retrievalConfiguration={
            "managedSearchConfiguration": {}
        },
    )

    results = retrieve_response.get("retrievalResults", [])

    if not results:
        context = "No relevant documents found in the knowledge base."
        sources = []
    else:
        passages = [r["content"]["text"] for r in results if "content" in r]
        context = "\n\n---\n\n".join(passages)

        # Extract S3 URIs from the location metadata — these are the actual source docs
        sources = list({
            r["location"]["s3Location"]["uri"]
            for r in results
            if r.get("location", {}).get("s3Location", {}).get("uri")
        })

    # Step 2 — Ask the LLM with the retrieved context injected into the prompt
    prompt = (
        f"You are a helpful and friendly travel assistant.\n"
        f"Use the following reference documents to answer the question accurately.\n\n"
        f"IMPORTANT INSTRUCTION ON LANGUAGE:\n"
        f"- Always answer in the SAME LANGUAGE as the user's question. If the user asks in Indonesian, answer in natural Indonesian.\n"
        f"- Translate and summarize the information from the reference documents to match the question's language.\n\n"
        f"REFERENCE DOCUMENTS:\n{context}\n\n"
        f"QUESTION: {question}\n\n"
        f"Answer clearly based on the documents above. If the answer is not in the documents, say so in the user's language."
    )

    runtime = get_bedrock_runtime_client()
    body = json.dumps({
        "messages": [
            {
                "role": "user",
                "content": [{"text": prompt}],
            }
        ],
        "inferenceConfig": {
            "maxTokens": 1024,
            "temperature": 0.3,
        },
    })

    response = runtime.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=body,
    )

    result = json.loads(response["body"].read())
    answer = result["output"]["message"]["content"][0]["text"]

    return {"answer": answer, "sources": sources}
