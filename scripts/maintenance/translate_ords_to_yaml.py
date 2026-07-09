#!/usr/bin/env python3
import argparse
import pandas as pd
import yaml
from pathlib import Path

# Parse command-line arguments
parser = argparse.ArgumentParser(description='Convert ODS files to YAML dataset')
parser.add_argument('--dataset-output', type=str, default='dataset.yaml',
                    help='Output path for the dataset YAML file (default: dataset.yaml)')
parser.add_argument('--mismatch-output', type=str, default='mismatch.yaml',
                    help='Output path for the mismatch YAML file (default: mismatch.yaml)')
args = parser.parse_args()

# Directory containing the ODS files
data_dir = Path("src/assets/data")

# Find all ODS files
ods_files = sorted(data_dir.glob("*.ods"))

datasets = []
res = []
mismatches = {}

for idx, ods_file in enumerate(ods_files, start=1):
    df = pd.read_excel(ods_file, engine='odf')
    datasets.append(df)

# Check that all datasets have the same number of rows
row_counts = [len(df) for df in datasets]
# if len(set(row_counts)) > 1:
#     print("Error: Datasets have different number of rows")
#     for idx, ods_file in enumerate(ods_files):
#         print(f"  {ods_file.name}: {row_counts[idx]} rows")
#     raise ValueError("All datasets must have the same number of rows")

num_rows = len(datasets[0])
for row_idx in range(num_rows):
    # Check that "to_annotate" is the same across all datasets for this row
    to_annotate_values = [df.iloc[row_idx]['to_annotate'] for df in datasets]

    # Verify all to_annotate values are the same
    if len(set(to_annotate_values)) > 1:
        # Track mismatch: map paragraph to list of file names
        mismatches[row_idx] = {}
        for idx, ods_file in enumerate(ods_files):
            paragraph_val = to_annotate_values[idx]
            if paragraph_val not in mismatches[row_idx]:
                mismatches[row_idx][paragraph_val] = []
            mismatches[row_idx][paragraph_val].append(ods_file.name)

    paragraph = to_annotate_values[0]

    # Concatenate all "solution" values from all datasets for this row
    words = []
    for df in datasets:
        solution = df.iloc[row_idx]['solution']
        if pd.notna(solution):  # Only add non-null solutions
            # Convert numeric strings to actual numbers to avoid quotes in YAML
            if isinstance(solution, str) and solution.isdigit():
                words.append(int(solution))
            else:
                words.append(solution)

    # Append to results
    res.append({
        "id": row_idx + 1,
        "paragraph": paragraph,
        "words": words
    })

with open(args.dataset_output, 'w', encoding='utf-8') as f:
    yaml.dump({ 'datasets': res }, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
print(f"Generated {args.dataset_output} with {len(res)} datasets")

if mismatches:
    with open(args.mismatch_output, 'w', encoding='utf-8') as f:
        yaml.dump(mismatches, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
    print(f"Found {len(mismatches)} mismatches, saved to {args.mismatch_output}")
else:
    print("No mismatches found!")
