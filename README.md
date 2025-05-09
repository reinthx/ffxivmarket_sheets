# FFXIV Market Sheets API

This script is designed to integrate with Google Sheets to fetch and update Final Fantasy XIV market data using Universalis and Teamcraft APIs. It processes item data, retrieves market prices, and updates a Google Sheet with the results.

## Features

- Fetches item data from the [FFXIV Teamcraft](https://github.com/ffxiv-teamcraft/ffxiv-teamcraft) repository.
- Retrieves market data from the [Universalis API](https://universalis.app/).
- Updates a Google Sheet with item prices, world names, average prices, and sale velocities.
- Supports batch processing for efficient API calls.
- Centralized configuration for easier customization.

## Requirements

- A Google Sheet with the following sheets:
  - **Source Sheet**: Contains item names to fetch data.
  - **Output Sheet**: Receives the processed data.
- A range in the output sheet mapping world IDs to world names.
- Google Apps Script environment to run the script.

## Setup

1. Open your Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Copy and paste the contents of `FFXIV_Sheets_Api.ts` into the Apps Script editor.
4. Save the script.

## Configuration

The script includes centralized configuration variables at the top for easier customization:

```typescript
const SOURCE_SHEET_NAME = "Materials";                // Name of the source sheet
const OUTPUT_SHEET_NAME = "MarketData";               // Name of the output sheet
const WORLD_MAP_RANGE = "Y2:Z86";                     // Range mapping world IDs to names
const SOURCE_DATA_RANGE_START = "A2";                 // Starting cell for source data
```

## Usage

1. Run the `updateXivApiDataSheet` function from the Apps Script editor or set up a trigger to run it periodically.
2. The script will:
   - Fetch item IDs from the Teamcraft data.
   - Retrieve market data from Universalis.
   - Update the output sheet with the following columns:
     - Item Name
     - Item ID (with a hyperlink to Universalis)
     - Price Per Unit
     - World Name
     - Average Price
     - Sale Velocity
     - Status

## Output Example

The output sheet will look like this:

| Item Name       | Item ID (Link) | Price Per Unit | World Name | Average Price | Sale Velocity | Status       |
|------------------|----------------|----------------|------------|---------------|---------------|--------------|
| Iron Ore         | 12345          | 10 (NQ)        | Gilgamesh  | 12            | 5             | ✅ Success    |
| Mythril Ingot    | 67890          | 50 (HQ)        | Balmung    | 55            | 2             | ✅ Success    |
| Invalid Item     |                |                |            |               |               | ❌ Error in Name or ID |

## Logging

The script uses `Logger.log` to provide detailed information about its execution, including:
- Missing sheets.
- API batch failures.
- Items with no valid listings.

## License

This project is licensed under the [MIT License](LICENSE).
