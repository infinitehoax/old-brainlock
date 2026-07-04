import json
import os
import sys

# Brain Lock Manager - Revamped version of cool.py
# Features: Schema validation, ID renumbering, Template generation

def validate_questions(questions):
    """Validates the structure of the questions list."""
    required_keys = ['id', 'type', 'question', 'category', 'correctAnswer']
    valid_types = [
        'multiple-choice', 'true-false', 'short-answer', 'fill-in-the-blank',
        'odd-one-out', 'spell-it-out', 'word-scramble', 'organize-tags',
        'categorize-items', 'sequence-order', 'connect-terms', 'ipa-transcriber'
    ]

    errors = []
    ids = set()

    for idx, q in enumerate(questions):
        # Check required keys
        for key in required_keys:
            if key not in q:
                errors.append(f"Question at index {idx} is missing required key: '{key}'")

        if 'id' in q:
            if q['id'] in ids:
                errors.append(f"Duplicate ID found: {q['id']} at index {idx}")
            ids.add(q['id'])

        if 'type' in q and q['type'] not in valid_types:
            errors.append(f"Invalid type '{q['type']}' at index {idx}. Must be one of: {', '.join(valid_types)}")

        # Type-specific validation
        if q.get('type') == 'multiple-choice' or q.get('type') == 'odd-one-out':
            if 'answers' not in q or not isinstance(q['answers'], list):
                errors.append(f"Type '{q['type']}' at index {idx} requires an 'answers' list.")

        if q.get('type') == 'organize-tags' or q.get('type') == 'categorize-items':
            if 'buckets' not in q or 'items' not in q:
                errors.append(f"Type '{q['type']}' at index {idx} requires 'buckets' and 'items'.")

    return errors

def renumber_questions(questions, start_id=1):
    """Renumbers question IDs starting from start_id."""
    for idx, q in enumerate(questions):
        q['id'] = start_id + idx
    return questions

def generate_template():
    """Generates a sample questions.json with all 13 interaction types."""
    template = [
        {
            "id": 1,
            "type": "multiple-choice",
            "question": "What is the largest planet in our solar system?",
            "category": "Academic",
            "answers": [
                {"text": "Earth", "feedback": "Incorrect. Earth is the 5th largest."},
                {"text": "Jupiter", "feedback": "Correct! Jupiter is a gas giant and the largest planet."},
                {"text": "Mars", "feedback": "Incorrect. Mars is smaller than Earth."},
                {"text": "Saturn", "feedback": "Incorrect. Saturn is the 2nd largest."}
            ],
            "correctAnswer": "Jupiter",
            "generalFeedback": "Jupiter is more than twice as massive as all the other planets in the Solar System combined."
        },
        {
            "id": 2,
            "type": "true-false",
            "question": "The Great Wall of China is visible from the Moon with the naked eye.",
            "category": "Academic",
            "answers": [
                {"text": "True", "feedback": "Incorrect. This is a common myth."},
                {"text": "False", "feedback": "Correct! It is not visible without aid."}
            ],
            "correctAnswer": "False",
            "generalFeedback": "Apollo astronauts confirmed that the Great Wall is not visible from the Moon."
        },
        {
            "id": 3,
            "type": "short-answer",
            "question": "What is the chemical symbol for Gold?",
            "category": "Academic",
            "correctAnswer": "Au",
            "generalFeedback": "Au comes from the Latin word for gold, 'aurum'."
        },
        {
            "id": 4,
            "type": "fill-in-the-blank",
            "question": "The process of ___ is how plants convert sunlight into energy.",
            "category": "Academic",
            "correctAnswer": "photosynthesis",
            "generalFeedback": "Photosynthesis uses chlorophyll to capture light energy."
        },
        {
            "id": 5,
            "type": "odd-one-out",
            "question": "Which of these is NOT a primary color?",
            "category": "Academic",
            "answers": [
                {"text": "Red", "feedback": "Red is a primary color."},
                {"text": "Blue", "feedback": "Blue is a primary color."},
                {"text": "Green", "feedback": "Correct! Green is a secondary color (Yellow + Blue)."},
                {"text": "Yellow", "feedback": "Yellow is a primary color."}
            ],
            "correctAnswer": "Green"
        },
        {
            "id": 6,
            "type": "spell-it-out",
            "question": "Spell the word for a person who travels to space.",
            "category": "Academic",
            "correctAnswer": "ASTRONAUT",
            "generalFeedback": "The word comes from Greek words meaning 'star sailor'."
        },
        {
            "id": 7,
            "type": "word-scramble",
            "question": "Unscramble this science term: 'YVITARG'",
            "category": "Academic",
            "correctAnswer": "GRAVITY",
            "generalFeedback": "Gravity is the force that pulls objects toward each other."
        },
        {
            "id": 8,
            "type": "organize-tags",
            "question": "Sort these words into Nouns and Verbs.",
            "category": "Academic",
            "buckets": ["Noun", "Verb"],
            "items": [
                {"text": "Apple", "category": "Noun"},
                {"text": "Run", "category": "Verb"},
                {"text": "Book", "category": "Noun"},
                {"text": "Jump", "category": "Verb"}
            ],
            "correctAnswer": {
                "Apple": "Noun",
                "Run": "Verb",
                "Book": "Noun",
                "Jump": "Verb"
            }
        },
        {
            "id": 9,
            "type": "categorize-items",
            "question": "Categorize these animals by their habitat.",
            "category": "Academic",
            "buckets": ["Land", "Water"],
            "items": [
                {"text": "Elephant", "category": "Land"},
                {"text": "Shark", "category": "Water"},
                {"text": "Lion", "category": "Land"},
                {"text": "Whale", "category": "Water"}
            ],
            "correctAnswer": {
                "Elephant": "Land",
                "Shark": "Water",
                "Lion": "Land",
                "Whale": "Water"
            }
        },
        {
            "id": 10,
            "type": "sequence-order",
            "question": "Put these planets in order of distance from the Sun (closest to farthest).",
            "category": "Academic",
            "items": ["Mercury", "Venus", "Earth", "Mars"],
            "correctAnswer": ["Mercury", "Venus", "Earth", "Mars"]
        },
        {
            "id": 11,
            "type": "connect-terms",
            "question": "Match the countries to their capitals.",
            "category": "Academic",
            "leftColumn": ["France", "Japan", "Nigeria"],
            "rightColumn": ["Abuja", "Paris", "Tokyo"],
            "correctAnswer": {
                "France": "Paris",
                "Japan": "Tokyo",
                "Nigeria": "Abuja"
            }
        },
        {
            "id": 12,
            "type": "ipa-transcriber",
            "question": "Transcribe the word 'Cat' into IPA symbols.",
            "category": "IPA",
            "correctAnswer": "kæt",
            "generalFeedback": "The symbol /æ/ represents the short 'a' sound."
        },
        {
            "id": 13,
            "type": "multiple-choice",
            "videoId": "hW7DW9NIO9M",
            "question": "According to the video, which planet is known as the 'Red Planet'?",
            "category": "YouTube",
            "answers": [
                {"text": "Mars", "feedback": "Correct! Iron oxide on its surface gives it a reddish look."},
                {"text": "Venus", "feedback": "Incorrect. Venus is yellow/white."},
                {"text": "Jupiter", "feedback": "Incorrect. Jupiter is striped brown/white."},
                {"text": "Neptune", "feedback": "Incorrect. Neptune is blue."}
            ],
            "correctAnswer": "Mars",
            "generalFeedback": "Mars has been a target for many exploration missions."
        }
    ]
    return template

def main():
    print("--- Brain Lock Manager ---")
    print("1. Validate questions.json")
    print("2. Renumber IDs in questions.json")
    print("3. Generate sample questions.json (template)")
    choice = input("Enter choice (1-3): ")

    if choice == '1':
        filename = input("Enter filename (default questions.json): ") or "questions.json"
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            errors = validate_questions(data)
            if not errors:
                print("Validation successful! No errors found.")
            else:
                print(f"Validation failed with {len(errors)} errors:")
                for err in errors:
                    print(f" - {err}")
        except Exception as e:
            print(f"Error: {e}")

    elif choice == '2':
        filename = input("Enter filename (default questions.json): ") or "questions.json"
        start_id = int(input("Enter starting ID (default 1): ") or "1")
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            renumbered = renumber_questions(data, start_id)
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(renumbered, f, indent=2)
            print(f"Successfully renumbered {len(renumbered)} questions.")
        except Exception as e:
            print(f"Error: {e}")

    elif choice == '3':
        template = generate_template()
        with open("questions_sample.json", "w", encoding="utf-8") as f:
            json.dump(template, f, indent=2)
        print("Generated 'questions_sample.json' with 13 interaction types.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Automated testing for sandbox
        if sys.argv[1] == '--test':
            print("Running manager tests...")
            template = generate_template()
            errors = validate_questions(template)
            if not errors:
                print("Template validation passed.")
            else:
                print("Template validation failed!")
                sys.exit(1)
            renumbered = renumber_questions(template, 100)
            if renumbered[0]['id'] == 100:
                print("Renumbering test passed.")
            else:
                print("Renumbering test failed!")
                sys.exit(1)
    else:
        main()
