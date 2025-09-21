"use strict"

const argv = require("node:process").argv
const fs = require("node:fs")
const path = require("node:path")
const readline = require("node:readline")

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

const createTrackers = () => ({
  maxAmountWithoutDiscount: {
    value: -Infinity,
    record: null,
    process: function(row) {
      const totalAmount = row["unit price"] * row["quantity"]
      if (totalAmount < this.value) return
      this.value = totalAmount
      this.record = row
    },
    get message() {
      return `Max amount without discount: ${this.value}\nRecord: ${JSON.stringify(this.record, null, 2)}`
    }
  },
  maxAmountWithDiscount: {
    value: -Infinity,
    record: null,
    process: function(row) {
      const totalAmount = row["unit price"] * row["quantity"] * (1 - row["percentage discount"] / 100)
      if (totalAmount < this.value) return
      this.value = totalAmount
      this.record = row

    },
    get message() {
      return `Max amount with discount: ${this.value}\nRecord: ${JSON.stringify(this.record, null, 2)}`
    }
  },
  maxQuantity: {
    value: -Infinity,
    record: null,
    process: function(row) {
      const quantity = row["quantity"]
      if (quantity < this.value) return
      this.value = quantity
      this.record = row
    },
    get message() {
      return `Max quantity between all the records: ${this.value}\nRecord: ${JSON.stringify(this.record, null, 2)}`
    }
  },
  MaxDiffWithDiscount: {
    value: -Infinity,
    record: null,
    process: function(row) {
      const diff = row["quantity"] * row["unit price"] * row["percentage discount"] / 100
      if (diff < this.value) return
      this.value = diff
      this.record = row
    },
    get message() {
      return `Max difference between total amount with and without discount: ${this.value}\nRecord: ${JSON.stringify(this.record, null, 2)}`
    }
  }
})

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

const saveOutput = (outputPath, data) => {
  const cleanOutput = Object.fromEntries(
    Object.entries(data).map(([id, t]) => [
      id, { value: t.value, record: t.record }
    ])
  )
  const output = JSON.stringify(cleanOutput, null, 2)
  fs.writeFileSync(path.join(outputPath, "out.json"), output, "utf-8")
}

const main = async () => {
  try {
    const { inputFilePath, outputPath } = getOptions()
    const trackers = await processFile(inputFilePath)

    if (outputPath) {
      saveOutput(outputPath, trackers)
    } else {
      Object.values(trackers).forEach(tracker => console.log(tracker.message + "\n"))
    }
  } catch (err) {
    console.error(err.message)
  }
}

main()
