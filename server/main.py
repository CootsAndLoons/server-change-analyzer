from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from groq import Groq
from typing import Dict, Any
import yaml
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

import warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers.tokenization_utils_base")

app = Flask(__name__)
cors = CORS(app, origins='*')

client = Groq(
    api_key="your_api_key_here",
)

with open('prompt.yaml', 'r') as file:
    prompts = yaml.safe_load(file)

changeRecords = {
  "your_change_id_here": {
    "Change description": "your_change_description_here",
    "Change Subject": "your_change_subject_here"
  },
}

model = SentenceTransformer('all-MiniLM-L6-v2')

# Create embeddings for all change records
change_embeddings = {}
for cr_id, change in changeRecords.items():
    text = f"{change['Change Subject']} {change['Change description']}"
    change_embeddings[cr_id] = model.encode(text)

def retrieve_similar_changes(new_change: Dict[str, Any], top_k: int = 3) -> Dict[str, Dict[str, Any]]:
    new_text = f"{new_change['Change Subject']} {new_change['Change description']}"
    new_embedding = model.encode(new_text)

    similarities = {}
    for cr_id, embedding in change_embeddings.items():
        similarity = cosine_similarity([new_embedding], [embedding])[0][0]
        similarities[cr_id] = similarity

    top_similar = sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:top_k]

    return {cr_id: changeRecords[cr_id] for cr_id, _ in top_similar}

def analyze_change(new_change: Dict[str, Any]) -> str:
    similar_changes = retrieve_similar_changes(new_change)

    prompt_template = prompts['analyze_change']['prompt']

    prompt = prompt_template.format(
        change_subject=new_change['Change Subject'],
        change_description=new_change['Change description'],
        change_records=similar_changes
    )

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="llama3-8b-8192",
    )

    return chat_completion.choices[0].message.content

@app.route("/api/analyze-change", methods=["POST"])
def analyze_change_route():
    data = request.json
    if not data or 'Change Subject' not in data or 'Change description' not in data:
        return jsonify({"error": "Invalid input. Please provide 'Change Subject' and 'Change description'."}), 400

    new_change = {
        "Change Subject": data['Change Subject'],
        "Change description": data['Change description']
    }

    result = analyze_change(new_change)
    return jsonify({"analysis": result})

if __name__ == "__main__":
    app.run(debug=True, port=8080)
