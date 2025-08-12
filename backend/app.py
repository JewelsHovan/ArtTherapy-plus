from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from openai import OpenAI
import base64
import requests
from io import BytesIO
from PIL import Image
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Configure CORS with all necessary options
CORS(app, 
     resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}},
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     supports_credentials=True)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'API is running'})

@app.route('/api/generate/image', methods=['POST', 'OPTIONS'])
def generate_image():
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    """Generate an image based on pain description using DALL-E"""
    try:
        data = request.json
        pain_description = data.get('description', '')
        
        if not pain_description:
            return jsonify({'error': 'Description is required'}), 400
        
        # Create an artistic prompt based on the pain description
        artistic_prompt = f"""Create an abstract artistic representation of: {pain_description}. 
        Style: Abstract expressionist art therapy piece with vibrant colors that transform pain into beauty. 
        Use flowing organic shapes, bold brushstrokes, and symbolic elements that represent healing and transformation.
        The artwork should be uplifting and therapeutic while acknowledging the pain experience."""
        
        logger.info(f"Generating image for: {pain_description}")
        
        # Generate image using DALL-E 3
        response = client.images.generate(
            model="dall-e-3",
            prompt=artistic_prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        image_url = response.data[0].url
        
        # Also generate a revised prompt if available
        revised_prompt = response.data[0].revised_prompt if hasattr(response.data[0], 'revised_prompt') else artistic_prompt
        
        return jsonify({
            'success': True,
            'image_url': image_url,
            'prompt_used': revised_prompt,
            'original_description': pain_description
        })
        
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate/prompt', methods=['POST', 'OPTIONS'])
def generate_prompt():
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    """Generate creative prompts based on pain description"""
    try:
        data = request.json
        pain_description = data.get('description', '')
        
        if not pain_description:
            return jsonify({'error': 'Description is required'}), 400
        
        # Use GPT to generate creative prompts
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are an art therapist helping people transform their pain experiences into creative expression. 
                    Generate 3 different artistic prompts that could help someone process and express their pain through art. 
                    Each prompt should be encouraging, creative, and therapeutic. 
                    Return the prompts as a JSON array with keys: 'prompt', 'technique', and 'emotional_focus'."""
                },
                {
                    "role": "user",
                    "content": f"My pain experience: {pain_description}"
                }
            ],
            response_format={"type": "json_object"}
        )
        
        response_text = completion.choices[0].message.content
        import json
        prompts = json.loads(response_text)
        
        return jsonify({
            'success': True,
            'prompts': prompts.get('prompts', []),
            'original_description': pain_description
        })
        
    except Exception as e:
        logger.error(f"Error generating prompts: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reflect', methods=['POST', 'OPTIONS'])
def reflect():
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    """Generate reflection questions based on the created artwork"""
    try:
        data = request.json
        pain_description = data.get('description', '')
        image_context = data.get('image_context', '')
        
        # Generate reflection questions using GPT
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are an art therapist guiding someone through reflection on their creative expression of pain. 
                    Generate 5 thoughtful reflection questions that help them process their experience and find meaning in their artwork.
                    Return as a JSON object with a 'questions' array."""
                },
                {
                    "role": "user",
                    "content": f"Pain described: {pain_description}\nArtwork context: {image_context}"
                }
            ],
            response_format={"type": "json_object"}
        )
        
        response_text = completion.choices[0].message.content
        import json
        questions = json.loads(response_text)
        
        return jsonify({
            'success': True,
            'questions': questions.get('questions', []),
            'original_description': pain_description
        })
        
    except Exception as e:
        logger.error(f"Error generating reflection: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/inspire', methods=['GET'])
def get_inspiration():
    """Get inspirational prompts for creative expression"""
    try:
        # Generate inspirational prompts
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """Generate 5 inspirational art therapy prompts that help people explore their emotions and experiences through creative expression.
                    Focus on themes of transformation, healing, and self-discovery.
                    Return as a JSON object with an 'inspirations' array, each containing 'title' and 'prompt'."""
                },
                {
                    "role": "user",
                    "content": "Give me inspirational art therapy prompts"
                }
            ],
            response_format={"type": "json_object"}
        )
        
        response_text = completion.choices[0].message.content
        import json
        inspirations = json.loads(response_text)
        
        return jsonify({
            'success': True,
            'inspirations': inspirations.get('inspirations', [])
        })
        
    except Exception as e:
        logger.error(f"Error getting inspiration: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Check if API key is set
    if not os.getenv('OPENAI_API_KEY'):
        logger.warning("OPENAI_API_KEY not set. Please set it in .env file")
    
    app.run(debug=True, port=5000)