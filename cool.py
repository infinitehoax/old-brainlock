import json

# --- Configuration ---
# Set the input and output file names
input_file_name = 'question4.json'
output_file_name = 'question4_renumbered.json'

# Set the number you want the new IDs to start from
new_start_id = 316

# --- Main Logic ---
try:
    # Step 1: Read and parse the input JSON file
    # We use 'utf-8' encoding to handle a wide range of characters.
    with open(input_file_name, 'r', encoding='utf-8') as f_in:
        mcq_data = json.load(f_in)

    # Check if the loaded data is a list
    if not isinstance(mcq_data, list):
        print("Error: The JSON file does not contain a list of questions.")
    else:
        # Step 2: Iterate through the list and renumber the IDs
        # We use enumerate to get the index (0, 1, 2, ...) which we can add to our start_id
        for index, mcq in enumerate(mcq_data):
            # Calculate the new ID and update the dictionary
            # mcq is a direct reference to the dictionary in the list
            mcq['id'] = new_start_id + index

        # Step 3: Write the modified data back to the output JSON file
        with open(output_file_name, 'w', encoding='utf-8') as f_out:
            # Use indent=4 for a nicely formatted, human-readable output file
            json.dump(mcq_data, f_out, indent=4)

        print(f"Success! Renumbered {len(mcq_data)} MCQs.")
        print(f"New IDs now range from {new_start_id} to {new_start_id + len(mcq_data) - 1}.")
        print(f"Output has been saved to '{output_file_name}'.")

except FileNotFoundError:
    print(f"Error: The input file '{input_file_name}' was not found.")
    print("Please make sure the JSON file is in the same directory as the script and the name is correct.")
except json.JSONDecodeError:
    print(f"Error: Could not decode JSON from '{input_file_name}'. Please check if it's a valid JSON file.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")