"use strict"

const argv = require("node:process").argv
const fs = require("node:fs")
const path = require("node:path")
const readline = require("node:readline")

/**
 * Parse CLI arguments and validate input/output paths.
 *
 * @throws {Error} If no CSV file is provided, file does not exist,
 * or input is not a CSV.
 * @returns {{ inputFilePath: string, outputPath?: string }} 
 * Object containing the input CSV file path and optional output directory.
 */
const getOptions = () => {
  if (argv.length <= 2) {
    throw new Error("CSV file not provided")
  }

  const providedInputFilePath = argv[2].trim()
  const inputFilePath = path.isAbsolute(providedInputFilePath) ? providedInputFilePath : path.join(__dirname, providedInputFilePath)

  if (!fs.existsSync(inputFilePath)) {
    throw new Error("The provided file does not exists, check the inserted path")
  }

  const extension = inputFilePath.split(".").pop().toLowerCase()

  if (extension != "csv") {
    throw new Error("The provided file is not a CSV")
  }

  const providedOutputPath = argv.length >= 4 ? argv[3].trim() : undefined
  const outputPath = providedOutputPath == undefined ? undefined : path.isAbsolute(providedOutputPath) ? providedOutputPath : path.join(__dirname, providedOutputPath)

  if (outputPath != undefined && !fs.existsSync(outputPath)) {
    throw new Error("The provided output path does not exists, check the inserted path")
  }

  const options = { inputFilePath, outputPath }

  return options
}

/**
 * Check if an object has all of the specified properties.
 *
 * @param {Object} obj - The object to check.
 * @param {string[]} keys - Array of property names to verify.
 * @returns {boolean} True if all specified keys exist in the object, false otherwise.
 */
const hasProperties = (obj, keys) => {
  if (typeof obj !== "object" || obj === null) return false
  return keys.every(key => key in obj)
}

/**
 * Create and return a set of trackers used to analyze CSV rows.
 * Each tracker computes a specific maximum value based on the data.
 *
 * @returns {Object<string, {value: number, record: Object|null, process: Function, toString: Function, toJSON: Function}>}
 * Trackers for maxAmountWithoutDiscount, maxAmountWithDiscount, maxQuantity, maxDiffWithDiscount.
 */
const createTrackers = () => ({
  maxAmountWithoutDiscount: {
    value: -Infinity,
    record: null,
    process(row) {
      if (!hasProperties(row, ["quantity", "unit price"])) return
      const totalAmount = row["unit price"] * row["quantity"]
      if (totalAmount < this.value) return
      this.value = totalAmount
      this.record = row
    },
    toString() {
      return `Max amount without discount: ${this.value}\nRecord: ${JSON.stringify(this.record, null, 2)}`
    },
    toJSON() {
      return {
        value: this.value === -Infinity ? null : this.value,
        record: this.record
      }
    }
  },
  maxAmountWithDiscount: {
    value: -Infinity,
    record: null,
    process(row) {
      if (!hasProperties(row, ["quantity", "unit price", "percentage discount"])) return
      const totalAmount = row["unit price"] * row["quantity"] * (1 - row["percentage discount"] / 100)
      if (totalAmount < this.value) return
      this.value = totalAmount
      this.record = row
    },
    toString() {
      return `Max amount with discount: ${this.value}\nRecord: ${JSON.stringify(this.record, null, 2)}`
    },
    toJSON() {
      return {
        value: this.value === -Infinity ? null : this.value,
        record: this.record
      }
    }
  },
  maxQuantity: {
    value: -Infinity,
    record: null,
    process(row) {
      if (!hasProperties(row, ["quantity"])) return
      const quantity = row["quantity"]
      if (quantity < this.value) return
      this.value = quantity
      this.record = row
    },
    toString() {
      return `Max quantity between all the records: ${this.value}\nRecord: ${JSON.stringify(this.record, null, 2)}`
    },
    toJSON() {
      return {
        value: this.value === -Infinity ? null : this.value,
        record: this.record
      }
    }
  },
  maxDiffWithDiscount: {
    value: -Infinity,
    record: null,
    process(row) {
      if (!hasProperties(row, ["quantity", "unit price", "percentage discount"])) return
      const diff = row["quantity"] * row["unit price"] * row["percentage discount"] / 100
      if (diff < this.value) return
      this.value = diff
      this.record = row
    },
    toString() {
      return `Max difference between total amount with and without discount: ${this.value}\nRecord: ${JSON.stringify(this.record, null, 2)}`
    },
    toJSON() {
      return {
        value: this.value === -Infinity ? null : this.value,
        record: this.record
      }
    }
  }
})

/**
 * Process a CSV file line by line and update the trackers with each row.
 *
 * @async
 * @param {string} inputFilePath - Path to the CSV file.
 * @returns {Promise<Object>} Trackers updated with the data from the CSV file.
 */
const processFile = async (inputFilePath) => {
  const rl = readline.createInterface({ input: fs.createReadStream(inputFilePath, { encoding: "utf-8" }) })

  let headers = []
  let isFirstLine = true

  const trackers = createTrackers()

  for await (const line of rl) {
    const values = line.trim().split(",")

    if (isFirstLine) {
      headers = values.map(v => v.toLowerCase())
      isFirstLine = false
      continue
    }

    const row = Object.fromEntries(headers.map((h, i) => {
      const raw = values[i]
      const number = Number(raw)
      return [h, isNaN(number) ? raw : number]
    }))

    Object.values(trackers).forEach(tracker => tracker.process(row))
  }

  return trackers
}

/**
 * Save the analysis results to a JSON file.
 * @param {string} outputPath - Path where the output JSON file will be written.
 * @param {Object} data - Trackers containing the analysis results.
 */
const saveOutput = (outputPath, data) => {
  const output = JSON.stringify(data, null, 2)
  fs.writeFileSync(outputPath, output, "utf-8")
}

/**
 * Main entry point of the program.
 * - Parses CLI options
 * - Processes the input CSV file
 * - Either prints results to the console or saves them as JSON
 */
const main = async () => {
  try {
    const { inputFilePath, outputPath } = getOptions()
    const trackers = await processFile(inputFilePath)

    if (outputPath) {
      const outputName = inputFilePath.split("/").pop().split(".").shift() + ".json"
      saveOutput(path.join(outputPath, outputName), trackers)
    } else {
      Object.values(trackers).forEach(tracker => console.log(String(tracker) + "\n"))
    }
  } catch (err) {
    console.error(err.message)
  }
}

main()
