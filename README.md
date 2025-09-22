# node-exercise

This tool processes a CSV file and extracts useful insights:
- **Max amount with discount**
- **Max quantity across all records**
- **Max difference between total amount with and without discount**

The results can be printed to the console or saved as a JSON file.

---

## 📦 Requirements

- [Node.js](https://nodejs.org/) (version 16+ recommended)

---

## ▶️ Usage

From the command line, run:

```bash
node index.js <input-file> [output-directory]
```

- `<input-file>`: Path to a `.csv` file containing the data.  
- `[output-directory]` *(optional)*: A directory where results will be written as JSON.  
  - If omitted, results will be printed to the console.  
  - If provided, an `<input-file-name>.json` file will be created inside that directory.

---

## 📂 Input format

The CSV file **must have headers**. The program expects at least these columns:

- `unit price`
- `quantity`
- `percentage discount`

Example:

```csv
unit price,quantity,percentage discount
10,5,0
20,3,10
15,7,5
```

---

## 📤 Output

### Console output

If no output directory is provided, the program prints human-readable results:

```
Max amount with discount: 60
Record: {
  "unit price": 20,
  "quantity": 3,
  "percentage discount": 10,
  ...
}

...
```

### JSON output

If an output directory is provided, an `<input-file-name>.json` file is created containing structured data:

```json
{
  "maxAmountWithDiscount": {
    "value": 60,
    "record": {
      "unit price": 20,
      "quantity": 3,
      "percentage discount": 10,
      ...
    }
  },
  "maxQuantity": {
    "value": 7,
    "record": {
      "unit price": 15,
      "quantity": 7,
      "percentage discount": 5,
      ...
    }
  },
  "maxDiffWithDiscount": {
    "value": 6,
    "record": {
      "unit price": 20,
      "quantity": 3,
      "percentage discount": 10,
      ...
    }
  }
}
```

---

## ⚠️ Notes

- Input must be a `.csv` file.  
- If the file has no rows (only headers), all values remain `null`.  
- Fields that look like numbers are converted automatically; all other fields remain strings.  
