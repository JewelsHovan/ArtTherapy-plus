import argparse
import mimetypes
import os
import sys
from google import genai
from google.genai import types


def setup_args():
    parser = argparse.ArgumentParser(description="Generate images using Google GenAI (Gemini).")
    parser.add_argument("prompt", type=str, help="The text prompt for image generation.")
    parser.add_argument("--output", "-o", type=str, default="generated_image", help="Output filename or path (without extension).")
    parser.add_argument("--model", type=str, default="gemini-3-pro-image-preview", help="The model to use.")
    return parser.parse_args()


def save_binary_file(file_path, data):
    try:
        with open(file_path, "wb") as f:
            f.write(data)
        print(f"File saved to: {file_path}")
    except Exception as e:
        print(f"Error saving file {file_path}: {e}", file=sys.stderr)


def generate(prompt, output_base, model_name):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.", file=sys.stderr)
        sys.exit(1)

    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error initializing client: {e}", file=sys.stderr)
        sys.exit(1)

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
            ],
        ),
    ]

    generate_content_config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
        image_config=types.ImageConfig(image_size="1K"),
    )

    print(f"Generating image for prompt: '{prompt[:80]}...' using model '{model_name}'...")

    try:
        file_index = 0
        for chunk in client.models.generate_content_stream(
            model=model_name,
            contents=contents,
            config=generate_content_config,
        ):
            if (
                chunk.candidates is None
                or chunk.candidates[0].content is None
                or chunk.candidates[0].content.parts is None
            ):
                continue

            for part in chunk.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    ext = mimetypes.guess_extension(part.inline_data.mime_type) or ".png"

                    if os.path.isdir(output_base):
                        file_name = os.path.join(output_base, f"generated_{file_index}{ext}")
                    else:
                        base, user_ext = os.path.splitext(output_base)
                        if user_ext:
                            file_name = output_base if file_index == 0 else f"{base}_{file_index}{user_ext}"
                        else:
                            suffix = f"_{file_index}" if file_index > 0 else ""
                            file_name = f"{output_base}{suffix}{ext}"

                    save_binary_file(file_name, part.inline_data.data)
                    file_index += 1
                elif part.text:
                    print(part.text, end="")

        print()

    except Exception as e:
        print(f"Error during generation: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    args = setup_args()
    generate(args.prompt, args.output, args.model)
