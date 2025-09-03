# 📊 Automatic Data System

## 🚀 How to Add New Data

### ✅ **Simple Method (Recommended)**
1. **Drag and drop** your `data-YYYY.json` file into the `public/` folder
2. **That's it!** The application will automatically detect the new file
3. **Refresh** the page to see the new year in the dropdown

### 📁 **File Format**
- **Name**: `data-YYYY.json` (e.g., `data-2025.json`)
- **Content**: JSON array with subsidies
- **Structure**: Compatible with existing formats (2019-2024)

### 🔍 **Automatic Detection**
The application automatically scans `data-*.json` files in the `public/` folder and:
- ✅ Detects new years
- ✅ Updates the year dropdown
- ✅ Automatically loads data
- ✅ Handles format errors

### 📅 **Supported Years**
The system automatically detects years from **2015 to 2030**.

### 🛠️ **Troubleshooting**
If a file doesn't appear:
1. Check that the name is exactly `data-YYYY.json`
2. Check that the file is in the `public/` folder
3. Check that the JSON is valid
4. Hard refresh the page (Ctrl+F5)

### 📊 **Current Data**
- 2019: 1,261 subsidies
- 2020: 1,233 subsidies  
- 2021: 1,269 subsidies
- 2022: 1,248 subsidies
- 2023: 1,400 subsidies
- 2024: 1,224 subsidies

**Total: 7,635 subsidies**

## 📋 **Data Source**

### 🏛️ **Official Source**
All data comes from the official **Open Data Brussels** platform:
- **Website**: [opendata.brussels.be](https://opendata.brussels.be/explore/?q=subside&disjunctive.theme&disjunctive.keyword&disjunctive.publisher&disjunctive.attributions&disjunctive.dcat.creator&disjunctive.dcat.contributor&disjunctive.modified&disjunctive.data_processed&disjunctive.features&disjunctive.license&disjunctive.language&sort=explore.popularity_score)
- **Publisher**: Ville de Bruxelles - Stad Brussel - City of Brussels
- **Data Type**: Public subsidies and grants
- **License**: Open Data License

### 🔄 **Data Processing**
- Raw data is processed and normalized for better analysis
- Categories are automatically assigned based on project descriptions
- Duplicate entries are removed for cleaner visualization
- Data is aggregated by year, category, and beneficiary

### 📊 **Data Quality**
- ✅ **Official source**: Direct from Brussels City Hall
- ✅ **Regular updates**: Data is updated annually
- ✅ **Complete coverage**: All public subsidies included
- ✅ **Transparent**: Full traceability to original datasets
