///////////////////////////////////////////////////////////////////////////
// Configuration Variables
///////////////////////////////////////////////////////////////////////////
const SOURCE_SHEET_NAME = "Materials";
const OUTPUT_SHEET_NAME = "MarketData";
const WORLD_MAP_RANGE = "Y2:Z86"; // This range is in the OUTPUT_SHEET (MarketData default)
const SOURCE_DATA_RANGE_START = "E5"; // This value is in the SOURCE_SHEET (Materials default)
///////////////////////////////////////////////////////////////////////////

function loadItemDataFromGitHub() {
    const url = "https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/libs/data/src/lib/json/items.json";
    const response = UrlFetchApp.fetch(url);
    return JSON.parse(response.getContentText());
}

function fetchItemIdFromCache(itemName, data) {
    const normalized = itemName.toLowerCase().trim();
    for (const id in data) {
        if (data[id]?.en?.toLowerCase() === normalized) {
            return id;
        }
    }
    return "";
}

function updateXivApiDataSheet() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    const sourceSheet = spreadsheet.getSheetByName(SOURCE_SHEET_NAME);
    const outputSheet = spreadsheet.getSheetByName(OUTPUT_SHEET_NAME);

    if (!sourceSheet || !outputSheet) {
        Logger.log("❌ Missing required sheet.");
        return;
    }

    const worldMapRange = outputSheet.getRange(WORLD_MAP_RANGE).getValues();
    const worldIdToName = {};
    for (const [id, name] of worldMapRange) {
        if (id && name) {
            worldIdToName[id.toString()] = name;
        }
    }

    const itemData = loadItemDataFromGitHub();

    const rows = sourceSheet.getRange(`${SOURCE_DATA_RANGE_START}:E${sourceSheet.getLastRow()}`).getValues();
    const itemNames = rows.map(r => r[0]).filter(Boolean);

    const itemIdMap = {};
    const idToName = {};
    const itemIds = [];

    itemNames.forEach(name => {
        const id = fetchItemIdFromCache(name, itemData);
        if (id) {
            itemIdMap[name] = id;
            idToName[id] = name;
            itemIds.push(id);
        }
    });

    const results = [];
    const universalisData = {};
    const batchSize = 50;

    for (let i = 0; i < itemIds.length; i += batchSize) {
        const batch = itemIds.slice(i, i + batchSize).join(",");
        Logger.log(`📦 Total items to update: ${itemIds.length}`);
        const url = `https://universalis.app/api/v2/aggregated/Aether/${batch}`;

        try {
            const response = UrlFetchApp.fetch(url);
            const data = JSON.parse(response.getContentText());
            const items = data.results || [];

            for (const entry of items) {
                const id = entry.itemId?.toString();
                if (!id) continue;

                const nq = entry.nq || {};
                const hq = entry.hq || {};
                const nqListing = nq.minListing?.dc;
                const hqListing = hq.minListing?.dc;

                let selectedListing = nqListing;
                let listingType = "NQ";

                if (hqListing && hqListing.price != null) {
                    selectedListing = hqListing;
                    listingType = "HQ";
                }

                if (selectedListing?.price != null) {
                    const worldId = selectedListing.worldId?.toString() ?? "";
                    const worldName = worldIdToName[worldId] ?? worldId;

                    universalisData[id] = {
                        pricePerUnit: `${selectedListing.price} (${listingType})`,
                        worldName: worldName,
                        averagePrice: hq.averageSalePrice?.dc?.price ?? nq.averageSalePrice?.dc?.price ?? "",
                        saleVelocity: hq.dailySaleVelocity?.dc?.quantity ?? nq.dailySaleVelocity?.dc?.quantity ?? ""
                    };

                    Logger.log(`✅ ${id} → ${selectedListing.price} (${listingType}) @ ${worldName}`);
                } else {
                    Logger.log(`⚠️ No valid listing for ${id}`);
                }
            }

        } catch (err) {
            Logger.log(`❌ API batch failed: ${err}`);
        }
    }

    itemNames.forEach(name => {
        const id = itemIdMap[name];
        const entry = universalisData[id];

        if (!id) {
            results.push([name, "", "", "", "", "", "❌ Error in Name or ID"]);
        } else if (!entry) {
            results.push([name, id, "", "", "", "", "⚠️ No Universalis data"]);
        } else {
            results.push([
                name,
                `=HYPERLINK("https://universalis.app/market/${id}", "${id}")`,
                entry.pricePerUnit,
                entry.worldName,
                entry.averagePrice,
                entry.saleVelocity,
                "✅ Success"
            ]);
        }
    });

    if (results.length) {
        outputSheet.getRange(2, 1, results.length, results[0].length).setValues(results);
        Logger.log(`✅ Wrote ${results.length} rows`);
    } else {
        Logger.log("⚠️ No data to write");
    }
}